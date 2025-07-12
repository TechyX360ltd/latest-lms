-- =============================
-- CHAT STATUS MANAGEMENT MIGRATION
-- =============================

-- Add status constraint to chats table if it doesn't exist
DO $$
BEGIN
  -- Check if the constraint already exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'chats_status_check' 
    AND table_name = 'chats'
  ) THEN
    -- Add status constraint
    ALTER TABLE chats 
    ADD CONSTRAINT chats_status_check 
    CHECK (status IN ('open', 'closed', 'resolved'));
  END IF;
END $$;

-- Add closed_at column to chats table
ALTER TABLE chats 
ADD COLUMN IF NOT EXISTS closed_at timestamptz,
ADD COLUMN IF NOT EXISTS closed_by uuid REFERENCES users(id),
ADD COLUMN IF NOT EXISTS close_reason text;

-- Add index for status queries
CREATE INDEX IF NOT EXISTS idx_chats_status_created 
ON chats(status, created_at);

-- Function to close a chat
CREATE OR REPLACE FUNCTION close_chat(
  p_chat_id uuid,
  p_admin_id uuid,
  p_reason text DEFAULT 'Closed by admin'
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update chat status to closed
  UPDATE chats 
  SET 
    status = 'closed',
    closed_at = now(),
    closed_by = p_admin_id,
    close_reason = p_reason
  WHERE 
    id = p_chat_id 
    AND status = 'open';
  
  -- Insert a system message indicating the chat was closed
  INSERT INTO messages (
    chat_id, 
    sender_id, 
    sender_role, 
    content
  ) VALUES (
    p_chat_id,
    p_admin_id,
    'admin',
    'Chat closed: ' || p_reason
  );
END;
$$;

-- Function to reopen a chat
CREATE OR REPLACE FUNCTION reopen_chat(
  p_chat_id uuid,
  p_admin_id uuid
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update chat status back to open
  UPDATE chats 
  SET 
    status = 'open',
    closed_at = NULL,
    closed_by = NULL,
    close_reason = NULL
  WHERE 
    id = p_chat_id 
    AND status = 'closed';
  
  -- Insert a system message indicating the chat was reopened
  INSERT INTO messages (
    chat_id, 
    sender_id, 
    sender_role, 
    content
  ) VALUES (
    p_chat_id,
    p_admin_id,
    'admin',
    'Chat reopened by admin'
  );
END;
$$;

-- Function to resolve a chat
CREATE OR REPLACE FUNCTION resolve_chat(
  p_chat_id uuid,
  p_admin_id uuid,
  p_resolution text DEFAULT 'Issue resolved'
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update chat status to resolved
  UPDATE chats 
  SET 
    status = 'resolved',
    closed_at = now(),
    closed_by = p_admin_id,
    close_reason = p_resolution
  WHERE 
    id = p_chat_id 
    AND status = 'open';
  
  -- Insert a system message indicating the chat was resolved
  INSERT INTO messages (
    chat_id, 
    sender_id, 
    sender_role, 
    content
  ) VALUES (
    p_chat_id,
    p_admin_id,
    'admin',
    'Chat resolved: ' || p_resolution
  );
END;
$$;

-- Function to get chat statistics
CREATE OR REPLACE FUNCTION get_chat_stats()
RETURNS TABLE(
  total_chats bigint,
  open_chats bigint,
  closed_chats bigint,
  resolved_chats bigint,
  avg_response_time interval
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_chats,
    COUNT(*) FILTER (WHERE status = 'open') as open_chats,
    COUNT(*) FILTER (WHERE status = 'closed') as closed_chats,
    COUNT(*) FILTER (WHERE status = 'resolved') as resolved_chats,
    AVG(
      CASE 
        WHEN closed_at IS NOT NULL 
        THEN closed_at - created_at 
        ELSE NULL 
      END
    ) as avg_response_time
  FROM chats;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION close_chat TO public;
GRANT EXECUTE ON FUNCTION reopen_chat TO public;
GRANT EXECUTE ON FUNCTION resolve_chat TO public;
GRANT EXECUTE ON FUNCTION get_chat_stats TO public;

-- Add comments for documentation
COMMENT ON COLUMN chats.closed_at IS 'Timestamp when the chat was closed';
COMMENT ON COLUMN chats.closed_by IS 'User ID of the admin who closed the chat';
COMMENT ON COLUMN chats.close_reason IS 'Reason for closing the chat';
COMMENT ON FUNCTION close_chat IS 'Closes a chat and adds a system message';
COMMENT ON FUNCTION reopen_chat IS 'Reopens a closed chat and adds a system message';
COMMENT ON FUNCTION resolve_chat IS 'Marks a chat as resolved and adds a system message';
COMMENT ON FUNCTION get_chat_stats IS 'Returns statistics about chat statuses and response times'; 