import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { getInvestorProfile, createInvestorProfile, updateInvestorProfile } from '../db/queries/investorProfiles';
import { getAllFounderProfiles } from '../db/queries/founderProfiles';
import { getConnectionsByInvestor, createConnection } from '../db/queries/connections';
import { FUNDING_STAGES, DOMAINS } from '../constants';

const profileSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  domain: z.enum([...DOMAINS] as [string, ...string[]], { message: 'Invalid domain. Please select from the allowed values.' }).optional(),
  stage_interest: z.enum([...FUNDING_STAGES] as [string, ...string[]], { message: 'Invalid funding stage. Please select from the allowed values.' }).optional(),
  description: z.string().optional(),
  logo_url: z.string().url().optional(),
  website: z.string().url().optional(),
});

export async function investorRoutes(fastify: FastifyInstance) {
  // Get or create investor profile
  fastify.get(
    '/profile',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user;
        if (!user || user.role !== 'investor') {
          return reply.status(403).send({ error: 'Forbidden' });
        }

        const profile = await getInvestorProfile(user.id);
        return reply.send({ profile });
      } catch (error) {
        console.error('Get profile error:', error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );

  // Create or update investor profile
  fastify.put(
    '/profile',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user;
        if (!user || user.role !== 'investor') {
          return reply.status(403).send({ error: 'Forbidden' });
        }

        const body = profileSchema.parse(request.body);
        const { name, email, phone, domain, stage_interest, description, logo_url, website } = body;

        let profile = await getInvestorProfile(user.id);

        if (profile) {
          profile = await updateInvestorProfile(user.id, {
            name,
            email,
            phone,
            domain,
            stage_interest,
            description,
            logo_url,
            website,
          });
        } else {
          profile = await createInvestorProfile(
            user.id,
            name,
            email,
            phone,
            domain,
            stage_interest,
            description,
            logo_url,
            website
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

  // Get all founders
  fastify.get(
    '/founders',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user;
        if (!user || user.role !== 'investor') {
          return reply.status(403).send({ error: 'Forbidden' });
        }

        const founders = await getAllFounderProfiles();
        const connections = await getConnectionsByInvestor(user.id);

        const foundersWithStatus = founders.map(founder => {
          const connection = connections.find(c => c.founder_id === founder.user_id);
          return {
            ...founder,
            connection_status: connection?.status || null,
            connection_id: connection?.id || null,
            is_requested_by_current_user: connection ? connection.investor_id === user.id : null,
          };
        });

        // Filter by query params if provided
        const { funding_stage, domain } = request.query as { funding_stage?: string; domain?: string };
        let filtered = foundersWithStatus;

        if (funding_stage) {
          filtered = filtered.filter(f => f.funding_stage === funding_stage);
        }
        if (domain) {
          filtered = filtered.filter(f => f.domain.toLowerCase().includes(domain.toLowerCase()));
        }

        return reply.send({ founders: filtered });
      } catch (error) {
        console.error('Get founders error:', error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );

  // Request connection to founder
  fastify.post(
    '/founders/connect',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest<{ Body: { founder_id: string } }>, reply: FastifyReply) => {
      try {
        const user = request.user;
        if (!user || user.role !== 'investor') {
          return reply.status(403).send({ error: 'Forbidden' });
        }

        const { founder_id } = request.body;
        const connection = await createConnection(founder_id, user.id, 'investor');
        return reply.send({ connection });
      } catch (error) {
        console.error('Connect to founder error:', error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );
}

