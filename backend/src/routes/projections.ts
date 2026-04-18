import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getFounderProfile } from '../db/queries/founderProfiles';
import { getCSVDataByFounder } from '../db/queries/csvData';
import { generateProjections } from '../services/projectionService';

export async function projectionsRoutes(fastify: FastifyInstance) {
  // Generate projections
  fastify.post(
    '/generate',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user;
        if (!user || user.role !== 'founder') {
          return reply.status(403).send({ error: 'Forbidden' });
        }

        const { months } = request.body as { months?: number };
        const projectionMonths = months || 6;

        // Get profile and CSV data
        const profile = await getFounderProfile(user.id);
        const csvData = await getCSVDataByFounder(user.id);

        if (csvData.length < 3) {
          return reply.status(400).send({
            error: 'Insufficient data',
            message: 'Need at least 3 months of historical data to generate projections'
          });
        }

        // Generate projections
        const result = await generateProjections(profile, csvData, projectionMonths);

        return reply.send(result);
      } catch (error: any) {
        console.error('Generate projections error:', error);
        return reply.status(500).send({
          error: 'Internal server error',
          message: error.message
        });
      }
    }
  );
}

