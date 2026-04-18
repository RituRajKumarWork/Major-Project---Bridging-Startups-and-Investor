import { query } from '../connection';

export interface MentorConversation {
  id: string;
  founder_id: string;
  user_message: string;
  assistant_response: string;
  created_at: Date;
}

export const createMentorConversation = async (
  founderId: string,
  userMessage: string,
  assistantResponse: string
): Promise<MentorConversation> => {
  const result = await query<MentorConversation>(
    `INSERT INTO mentor_conversations (founder_id, user_message, assistant_response)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [founderId, userMessage, assistantResponse]
  );
  return result.rows[0];
};

export const getMentorConversations = async (
  founderId: string,
  limit: number = 50
): Promise<MentorConversation[]> => {
  const result = await query<MentorConversation>(
    `SELECT * FROM mentor_conversations
     WHERE founder_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [founderId, limit]
  );
  return result.rows;
};

