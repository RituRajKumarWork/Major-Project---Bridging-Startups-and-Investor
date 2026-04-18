import { query } from '../connection';
import { Connection, ConnectionStatus, UserRole } from '../../types';

export const createConnection = async (
  founderId: string,
  investorId: string,
  initiatedBy: UserRole
): Promise<Connection> => {
  const result = await query<Connection>(
    `INSERT INTO connections (founder_id, investor_id, status, initiated_by)
     VALUES ($1, $2, 'pending', $3)
     ON CONFLICT (founder_id, investor_id)
     DO UPDATE SET status = 'pending', initiated_by = $3, updated_at = CURRENT_TIMESTAMP
     RETURNING *`,
    [founderId, investorId, initiatedBy]
  );
  return result.rows[0];
};

export const getConnection = async (
  founderId: string,
  investorId: string
): Promise<Connection | null> => {
  const result = await query<Connection>(
    'SELECT * FROM connections WHERE founder_id = $1 AND investor_id = $2',
    [founderId, investorId]
  );
  return result.rows[0] || null;
};

export const updateConnectionStatus = async (
  connectionId: string,
  status: ConnectionStatus
): Promise<Connection> => {
  const result = await query<Connection>(
    `UPDATE connections
     SET status = $1, updated_at = CURRENT_TIMESTAMP
     WHERE id = $2
     RETURNING *`,
    [status, connectionId]
  );
  return result.rows[0];
};

export const getConnectionsByFounder = async (founderId: string): Promise<Connection[]> => {
  const result = await query<Connection>(
    'SELECT * FROM connections WHERE founder_id = $1 ORDER BY created_at DESC',
    [founderId]
  );
  return result.rows;
};

export const getConnectionsByInvestor = async (investorId: string): Promise<Connection[]> => {
  const result = await query<Connection>(
    'SELECT * FROM connections WHERE investor_id = $1 ORDER BY created_at DESC',
    [investorId]
  );
  return result.rows;
};

export const getAcceptedConnections = async (userId: string, role: 'founder' | 'investor'): Promise<Connection[]> => {
  const column = role === 'founder' ? 'founder_id' : 'investor_id';
  const result = await query<Connection>(
    `SELECT * FROM connections
     WHERE ${column} = $1 AND status = 'accepted'
     ORDER BY updated_at DESC`,
    [userId]
  );
  return result.rows;
};

export const getPendingConnectionsByFounder = async (founderId: string): Promise<Connection[]> => {
  const result = await query<Connection>(
    `SELECT * FROM connections
     WHERE founder_id = $1 AND status = 'pending' AND initiated_by = 'investor'
     ORDER BY created_at DESC`,
    [founderId]
  );
  return result.rows;
};

export const getPendingConnectionsByInvestor = async (investorId: string): Promise<Connection[]> => {
  const result = await query<Connection>(
    `SELECT * FROM connections
     WHERE investor_id = $1 AND status = 'pending' AND initiated_by = 'founder'
     ORDER BY created_at DESC`,
    [investorId]
  );
  return result.rows;
};

