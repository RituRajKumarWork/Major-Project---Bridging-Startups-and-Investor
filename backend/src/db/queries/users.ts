import { query } from '../connection';
import { User, UserRole } from '../../types';

export const createUser = async (
  email: string,
  passwordHash: string,
  role: UserRole
): Promise<User> => {
  const result = await query<User>(
    `INSERT INTO users (email, password_hash, role)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [email, passwordHash, role]
  );
  return result.rows[0];
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
  const result = await query<User>(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );
  return result.rows[0] || null;
};

export const getUserById = async (id: string): Promise<User | null> => {
  const result = await query<User>(
    'SELECT * FROM users WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
};

export const getUserWithoutPassword = async (id: string) => {
  const result = await query<Omit<User, 'password_hash'>>(
    'SELECT id, email, role, created_at FROM users WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
};

