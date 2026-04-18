import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { createConnection, updateConnectionStatus, getConnection } from '../db/queries/connections';
import { ConnectionStatus } from '../types';

export async function connectionRoutes(fastify: FastifyInstance) {
  // Request connection
  fastify.post(
    '/request',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest<{ Body: { founder_id?: string; investor_id?: string } }>, reply: FastifyReply) => {
      try {
        const user = request.user;
        if (!user) {
          return reply.status(401).send({ error: 'Unauthorized' });
        }

        const { founder_id, investor_id } = request.body;

        if (user.role === 'founder' && investor_id) {
          const connection = await createConnection(user.id, investor_id, 'founder');
          return reply.send({ connection });
        } else if (user.role === 'investor' && founder_id) {
          const connection = await createConnection(founder_id, user.id, 'investor');
          return reply.send({ connection });
        } else {
          return reply.status(400).send({ error: 'Invalid request' });
        }
      } catch (error) {
        console.error('Request connection error:', error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );

  // Accept connection
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
        console.error('Accept connection error:', error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );

  // Reject connection
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
        console.error('Reject connection error:', error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );
}

