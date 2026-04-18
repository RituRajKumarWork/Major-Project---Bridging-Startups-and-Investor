import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { getFounderProfile } from '../db/queries/founderProfiles';
import { getCSVDataByFounder } from '../db/queries/csvData';
import { getMentorResponse } from '../services/ragService';
import { createMentorConversation, getMentorConversations } from '../db/queries/mentorConversations';
import { JWTUser } from '../types';

const chatSchema = z.object({
  message: z.string().min(1),
});

export async function mentorRoutes(fastify: FastifyInstance) {
  // Mentor chat
  fastify.post(
    '/chat',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user as JWTUser | undefined;

        if (!user || user.role !== 'founder') {
          return reply.status(403).send({ error: 'Forbidden' });
        }

        const body = chatSchema.parse(request.body);
        const { message } = body;

        // Get profile and CSV data for context
        const profile = await getFounderProfile(user.id);
        const csvData = await getCSVDataByFounder(user.id, 12);

        // Get AI response
        const response = await getMentorResponse(message, profile, csvData);

        // Save conversation to database
        await createMentorConversation(user.id, message, response);

        return reply.send({ response });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.status(400).send({ error: 'Invalid input', details: error.issues });
        }
        console.error('Mentor chat error:', error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );

  // Get conversation history
  fastify.get(
    '/history',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user as JWTUser | undefined;

        if (!user || user.role !== 'founder') {
          return reply.status(403).send({ error: 'Forbidden' });
        }

        const conversations = await getMentorConversations(user.id);
        return reply.send({ conversations });
      } catch (error) {
        console.error('Get mentor history error:', error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );
}

