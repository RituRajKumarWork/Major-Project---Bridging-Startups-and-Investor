import { query } from '../connection';
import { Message } from '../../types';

export const createMessage = async (
  connectionId: string,
  senderId: string,
  content: string
): Promise<Message> => {
  const result = await query<Message>(
    `INSERT INTO messages (connection_id, sender_id, content)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [connectionId, senderId, content]
  );
  return result.rows[0];
};

export const getMessagesByConnection = async (
  connectionId: string,
  limit: number = 100
): Promise<Message[]> => {
  const result = await query<Message>(
    `SELECT * FROM messages
     WHERE connection_id = $1
     ORDER BY created_at ASC
     LIMIT $2`,
    [connectionId, limit]
  );
  return result.rows;
};

export const getMessagesAfter = async (
  connectionId: string,
  afterDate: Date
): Promise<Message[]> => {
  const result = await query<Message>(
    `SELECT * FROM messages
     WHERE connection_id = $1 AND created_at > $2
     ORDER BY created_at ASC`,
    [connectionId, afterDate]
  );
  return result.rows;
};

