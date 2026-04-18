import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import dotenv from 'dotenv';
import { authenticate } from './middleware/auth';
import { authRoutes } from './routes/auth';
import { founderRoutes } from './routes/founders';
import { investorRoutes } from './routes/investors';
import { chatRoutes } from './routes/chat';
import { connectionRoutes } from './routes/connections';
import { mentorRoutes } from './routes/mentor';
import { projectionsRoutes } from './routes/projections';
import { requestsRoutes } from './routes/requests';

dotenv.config();

// Extend Fastify types
declare module 'fastify' {
  interface FastifyInstance {
    authenticate: typeof authenticate;
  }
  interface FastifyRequest {
    user?: import('./types').JWTUser;
  }
}

const fastify = Fastify({
  logger: true,
});

// Register plugins
fastify.register(cors, {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
});

fastify.register(jwt, {
  secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
});

fastify.register(multipart);

// Add authenticate decorator
fastify.decorate('authenticate', authenticate);

// Register routes
fastify.register(authRoutes, { prefix: '/api/auth' });
fastify.register(founderRoutes, { prefix: '/api/founders' });
fastify.register(investorRoutes, { prefix: '/api/investors' });
fastify.register(chatRoutes, { prefix: '/api/chat' });
fastify.register(connectionRoutes, { prefix: '/api/connections' });
fastify.register(mentorRoutes, { prefix: '/api/founders/mentor' });
fastify.register(projectionsRoutes, { prefix: '/api/founders/projections' });
fastify.register(requestsRoutes, { prefix: '/api/requests' });

// Health check
fastify.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Start server
const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3001;
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`Server listening on port ${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

// Graceful shutdown
process.on('SIGTERM', async () => {
  await fastify.close();
  process.exit(0);
});

