-- Mentor conversations table
CREATE TABLE IF NOT EXISTS mentor_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    founder_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_message TEXT NOT NULL,
    assistant_response TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_mentor_conversations_founder ON mentor_conversations(founder_id);
CREATE INDEX IF NOT EXISTS idx_mentor_conversations_created_at ON mentor_conversations(created_at);

