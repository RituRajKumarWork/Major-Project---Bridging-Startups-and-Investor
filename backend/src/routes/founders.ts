import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { getFounderProfile, createFounderProfile, updateFounderProfile } from '../db/queries/founderProfiles';
import { createCSVFile, getCSVFilesByFounder, deleteCSVFile, createCSVData, getCSVDataByFounder, deleteCSVDataByFile } from '../db/queries/csvData';
import { getAllInvestorProfiles } from '../db/queries/investorProfiles';
import { getConnectionsByFounder, createConnection } from '../db/queries/connections';
import { FUNDING_STAGES, DOMAINS } from '../constants';

const profileSchema = z.object({
  company_name: z.string().min(1),
  domain: z.enum([...DOMAINS] as [string, ...string[]], { message: 'Invalid domain. Please select from the allowed values.' }),
  funding_stage: z.enum([...FUNDING_STAGES] as [string, ...string[]], { message: 'Invalid funding stage. Please select from the allowed values.' }),
  valuation: z.number().positive(),
  description: z.string().optional(),
  social_links: z.record(z.string()).optional(),
});

export async function founderRoutes(fastify: FastifyInstance) {
  // Get or create founder profile
  fastify.get(
    '/profile',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user;
        if (!user || user.role !== 'founder') {
          return reply.status(403).send({ error: 'Forbidden' });
        }

        const profile = await getFounderProfile(user.id);
        return reply.send({ profile });
      } catch (error) {
        console.error('Get profile error:', error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );

  // Create or update founder profile
  fastify.put(
    '/profile',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user;
        if (!user || user.role !== 'founder') {
          return reply.status(403).send({ error: 'Forbidden' });
        }

        const body = profileSchema.parse(request.body);
        const { company_name, domain, funding_stage, valuation, description, social_links } = body;

        let profile = await getFounderProfile(user.id);

        if (profile) {
          profile = await updateFounderProfile(user.id, {
            company_name,
            domain,
            funding_stage,
            valuation,
            description,
            social_links,
          });
        } else {
          profile = await createFounderProfile(
            user.id,
            company_name,
            domain,
            funding_stage,
            valuation,
            description,
            social_links
          );
        }

        return reply.send({ profile });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.status(400).send({ error: 'Invalid input', details: error.errors });
        }
        console.error('Update profile error:', error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );

  // Get all investors
  fastify.get(
    '/investors',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user;
        if (!user || user.role !== 'founder') {
          return reply.status(403).send({ error: 'Forbidden' });
        }

        const investors = await getAllInvestorProfiles();
        const connections = await getConnectionsByFounder(user.id);

        const investorsWithStatus = investors.map(investor => {
          const connection = connections.find(c => c.investor_id === investor.user_id);
          return {
            ...investor,
            connection_status: connection?.status || null,
            connection_id: connection?.id || null,
            is_requested_by_current_user: connection ? connection.founder_id === user.id : null,
          };
        });

        return reply.send({ investors: investorsWithStatus });
      } catch (error) {
        console.error('Get investors error:', error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );

  // Request connection to investor
  fastify.post(
    '/investors/connect',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest<{ Body: { investor_id: string } }>, reply: FastifyReply) => {
      try {
        const user = request.user;
        if (!user || user.role !== 'founder') {
          return reply.status(403).send({ error: 'Forbidden' });
        }

        const { investor_id } = request.body;
        const connection = await createConnection(user.id, investor_id, 'founder');
        return reply.send({ connection });
      } catch (error) {
        console.error('Connect to investor error:', error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );

  // CSV upload
  fastify.post(
    '/csv/upload',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user;
        if (!user || user.role !== 'founder') {
          return reply.status(403).send({ error: 'Forbidden' });
        }

        const data = await request.file();
        if (!data) {
          return reply.status(400).send({ error: 'No file uploaded' });
        }

        const buffer = await data.toBuffer();
        const text = buffer.toString('utf-8');
        const lines = text.split('\n').filter(line => line.trim());

        if (lines.length < 2) {
          return reply.status(400).send({ error: 'Invalid CSV format' });
        }

        // Parse CSV (assuming format: Month,Revenue,Expenses,Profit)
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const monthIndex = headers.indexOf('month');
        const revenueIndex = headers.indexOf('revenue');
        const expensesIndex = headers.indexOf('expenses');
        const profitIndex = headers.indexOf('profit');

        if (monthIndex === -1 || revenueIndex === -1 || expensesIndex === -1 || profitIndex === -1) {
          return reply.status(400).send({ error: 'CSV must contain: Month, Revenue, Expenses, Profit columns' });
        }

        // Create CSV file record
        const csvFile = await createCSVFile(user.id, data.filename, {
          rows: lines.length - 1,
          uploaded_at: new Date().toISOString(),
        });

        // Insert data rows
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim());
          const month = new Date(values[monthIndex]);
          const revenue = parseFloat(values[revenueIndex]) || 0;
          const expenses = parseFloat(values[expensesIndex]) || 0;
          const profit = parseFloat(values[profitIndex]) || revenue - expenses;

          await createCSVData(user.id, csvFile.id, month, revenue, expenses, profit);
        }

        return reply.send({
          message: 'CSV uploaded successfully',
          file_id: csvFile.id,
          rows: lines.length - 1,
        });
      } catch (error) {
        console.error('CSV upload error:', error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );

  // Get CSV files
  fastify.get(
    '/csv',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user;
        if (!user || user.role !== 'founder') {
          return reply.status(403).send({ error: 'Forbidden' });
        }

        const files = await getCSVFilesByFounder(user.id);
        return reply.send({ files });
      } catch (error) {
        console.error('Get CSV files error:', error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );

  // Get CSV data
  fastify.get(
    '/csv/data',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user;
        if (!user || user.role !== 'founder') {
          return reply.status(403).send({ error: 'Forbidden' });
        }

        const data = await getCSVDataByFounder(user.id);
        return reply.send({ data });
      } catch (error) {
        console.error('Get CSV data error:', error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );

  // Delete CSV file
  fastify.delete(
    '/csv/:id',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const user = request.user;
        if (!user || user.role !== 'founder') {
          return reply.status(403).send({ error: 'Forbidden' });
        }

        const { id } = request.params;
        await deleteCSVDataByFile(id);
        const deleted = await deleteCSVFile(id, user.id);

        if (!deleted) {
          return reply.status(404).send({ error: 'File not found' });
        }

        return reply.send({ message: 'File deleted successfully' });
      } catch (error) {
        console.error('Delete CSV error:', error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );
}

