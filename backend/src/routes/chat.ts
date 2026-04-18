import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { getAcceptedConnections } from '../db/queries/connections';
import { createMessage, getMessagesByConnection, getMessagesAfter } from '../db/queries/messages';
import { getFounderProfile } from '../db/queries/founderProfiles';
import { getInvestorProfile } from '../db/queries/investorProfiles';

const messageSchema = z.object({
  connection_id: z.string().uuid(),
  content: z.string().min(1),
});

export async function chatRoutes(fastify: FastifyInstance) {
  // Get accepted connections
  fastify.get(
    '/connections',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user;
        if (!user) {
          return reply.status(401).send({ error: 'Unauthorized' });
        }

        const connections = await getAcceptedConnections(user.id, user.role);

        // Enrich connections with profile data
        const enrichedConnections = await Promise.all(
          connections.map(async (conn) => {
            try {
              if (user.role === 'founder') {
                const investorProfile = await getInvestorProfile(conn.investor_id);
                return {
                  ...conn,
                  investor_profile: investorProfile,
                };
              } else {
                const founderProfile = await getFounderProfile(conn.founder_id);
                return {
                  ...conn,
                  founder_profile: founderProfile,
                };
              }
            } catch {
              return conn;
            }
          })
        );

        return reply.send({ connections: enrichedConnections });
      } catch (error) {
        console.error('Get connections error:', error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );

  // Get messages for a connection
  fastify.get(
    '/messages/:connectionId',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest<{ Params: { connectionId: string } }>, reply: FastifyReply) => {
      try {
        const user = request.user;
        if (!user) {
          return reply.status(401).send({ error: 'Unauthorized' });
        }

        const { connectionId } = request.params;
        const { after } = request.query as { after?: string };

        let messages;
        if (after) {
          messages = await getMessagesAfter(connectionId, new Date(after));
        } else {
          messages = await getMessagesByConnection(connectionId);
        }

        return reply.send({ messages });
      } catch (error) {
        console.error('Get messages error:', error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );

  // Send message
  fastify.post(
    '/messages',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user;
        if (!user) {
          return reply.status(401).send({ error: 'Unauthorized' });
        }

        const body = messageSchema.parse(request.body);
        const { connection_id, content } = body;

        const message = await createMessage(connection_id, user.id, content);
        return reply.send({ message });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.status(400).send({ error: 'Invalid input', details: error.errors });
        }
        console.error('Send message error:', error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );
}

