-- Add initiated_by column to connections table to track who sent the connection request
ALTER TABLE connections
ADD COLUMN IF NOT EXISTS initiated_by user_role;

-- Update existing records: if founder_id matches a user, assume founder initiated (can be refined later)
-- For now, set a default value. Existing records will need manual review or can be set to NULL
-- Setting NULL for existing records as we can't determine who initiated them
UPDATE connections
SET initiated_by = NULL
WHERE initiated_by IS NULL;

-- Create index for better query performance on initiated_by
CREATE INDEX IF NOT EXISTS idx_connections_initiated_by ON connections(initiated_by);

