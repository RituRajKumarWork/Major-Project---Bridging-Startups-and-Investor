import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { createUser, getUserByEmail, getUserWithoutPassword } from '../db/queries/users';
import { JWTUser } from '../types';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['founder', 'investor']),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function authRoutes(fastify: FastifyInstance) {
  // Register
  fastify.post('/register', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = registerSchema.parse(request.body);
      const { email, password, role } = body;

      // Check if user exists
      const existingUser = await getUserByEmail(email);
      if (existingUser) {
        return reply.status(400).send({ error: 'User already exists' });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user
      const user = await createUser(email, passwordHash, role);

      // Generate JWT
      const token = fastify.jwt.sign({
        id: user.id,
        email: user.email,
        role: user.role,
      } as JWTUser);

      return reply.send({
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Invalid input', details: error.errors });
      }
      console.error('Register error:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Login
  fastify.post('/login', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = loginSchema.parse(request.body);
      const { email, password } = body;

      // Get user
      const user = await getUserByEmail(email);
      if (!user) {
        return reply.status(401).send({ error: 'Invalid credentials' });
      }

      // Verify password
      const isValid = await bcrypt.compare(password, user.password_hash);
      if (!isValid) {
        return reply.status(401).send({ error: 'Invalid credentials' });
      }

      // Generate JWT
      const token = fastify.jwt.sign({
        id: user.id,
        email: user.email,
        role: user.role,
      } as JWTUser);

      return reply.send({
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Invalid input', details: error.errors });
      }
      console.error('Login error:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Get current user
  fastify.get(
    '/me',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user;
        if (!user) {
          return reply.status(401).send({ error: 'Unauthorized' });
        }

        const userData = await getUserWithoutPassword(user.id);
        if (!userData) {
          return reply.status(404).send({ error: 'User not found' });
        }

        return reply.send({ user: userData });
      } catch (error) {
        console.error('Get me error:', error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );
}

