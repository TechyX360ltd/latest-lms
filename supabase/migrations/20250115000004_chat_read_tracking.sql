-- =============================
-- CHAT READ TRACKING MIGRATION
-- =============================

-- Add read tracking columns to messages table
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS is_read boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS read_at timestamptz;

-- Add index for performance on read status queries
CREATE INDEX IF NOT EXISTS idx_messages_chat_read_status 
ON messages(chat_id, is_read, created_at);

-- Add index for unread count queries
CREATE INDEX IF NOT EXISTS idx_messages_unread_count 
ON messages(chat_id, sender_role, is_read) 
WHERE sender_role = 'user' AND is_read = false;

-- Function to mark messages as read for a specific chat and user
CREATE OR REPLACE FUNCTION mark_chat_messages_as_read(
  p_chat_id uuid,
  p_user_id uuid,
  p_user_role text
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Mark all unread messages from the other user as read
  UPDATE messages 
  SET 
    is_read = true,
    read_at = now()
  WHERE 
    chat_id = p_chat_id 
    AND sender_role != p_user_role 
    AND is_read = false;
END;
$$;

-- Function to get unread message count for a chat
CREATE OR REPLACE FUNCTION get_chat_unread_count(p_chat_id uuid)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  unread_count integer;
BEGIN
  SELECT COUNT(*)
  INTO unread_count
  FROM messages
  WHERE 
    chat_id = p_chat_id 
    AND sender_role = 'user' 
    AND is_read = false;
  
  RETURN COALESCE(unread_count, 0);
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION mark_chat_messages_as_read TO public;
GRANT EXECUTE ON FUNCTION get_chat_unread_count TO public;

-- Add comments for documentation
COMMENT ON COLUMN messages.is_read IS 'Whether the message has been read by the recipient';
COMMENT ON COLUMN messages.read_at IS 'Timestamp when the message was first read by the recipient';
COMMENT ON FUNCTION mark_chat_messages_as_read IS 'Marks all unread messages in a chat as read for a specific user';
COMMENT ON FUNCTION get_chat_unread_count IS 'Returns the count of unread user messages in a chat'; 