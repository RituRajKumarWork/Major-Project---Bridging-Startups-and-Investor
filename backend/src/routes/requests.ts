import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getPendingConnectionsByFounder, getPendingConnectionsByInvestor } from '../db/queries/connections';
import { updateConnectionStatus } from '../db/queries/connections';
import { getFounderProfile } from '../db/queries/founderProfiles';
import { getInvestorProfile } from '../db/queries/investorProfiles';

export async function requestsRoutes(fastify: FastifyInstance) {
  // Get pending connection requests for current user
  fastify.get(
    '/',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user;
        if (!user) {
          return reply.status(401).send({ error: 'Unauthorized' });
        }

        let pendingConnections;
        if (user.role === 'founder') {
          pendingConnections = await getPendingConnectionsByFounder(user.id);
        } else if (user.role === 'investor') {
          pendingConnections = await getPendingConnectionsByInvestor(user.id);
        } else {
          return reply.status(403).send({ error: 'Forbidden' });
        }

        // Deduplicate connections by id to prevent duplicates
        const uniqueConnections = Array.from(
          new Map(pendingConnections.map(conn => [conn.id, conn])).values()
        );

        // Enrich connections with profile data
        const enrichedRequests = await Promise.all(
          uniqueConnections.map(async (conn) => {
            try {
              if (user.role === 'founder') {
                // Founder receives requests from investors
                const investorProfile = await getInvestorProfile(conn.investor_id);
                return {
                  ...conn,
                  sender_profile: investorProfile,
                };
              } else {
                // Investor receives requests from founders
                const founderProfile = await getFounderProfile(conn.founder_id);
                return {
                  ...conn,
                  sender_profile: founderProfile,
                };
              }
            } catch {
              return conn;
            }
          })
        );

        return reply.send({ requests: enrichedRequests });
      } catch (error) {
        console.error('Get requests error:', error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );

  // Accept connection request
  fastify.put(
    '/:id/accept',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const user = request.user;
        if (!user) {
          return reply.status(401).send({ error: 'Unauthorized' });
        }

        const { id } = request.params;
        const connection = await updateConnectionStatus(id, 'accepted');
        return reply.send({ connection });
      } catch (error) {
        console.error('Accept request error:', error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );

  // Reject connection request
  fastify.put(
    '/:id/reject',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const user = request.user;
        if (!user) {
          return reply.status(401).send({ error: 'Unauthorized' });
        }

        const { id } = request.params;
        const connection = await updateConnectionStatus(id, 'rejected');
        return reply.send({ connection });
      } catch (error) {
        console.error('Reject request error:', error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );
}

