-- Create live_sessions table for events/live sessions
CREATE TABLE IF NOT EXISTS live_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  course_id text REFERENCES courses(id) ON DELETE SET NULL,
  instructor_id uuid REFERENCES users(id) ON DELETE SET NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz,
  platform text,
  recurrence text,
  invitees uuid[],
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE live_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Instructors/Admins can create/update
CREATE POLICY "Instructors and admins can manage sessions" ON live_sessions
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND (users.role = 'admin' OR users.role = 'instructor')
    )
  );

-- Policy: Invitees can view
CREATE POLICY "Invitees can view sessions" ON live_sessions
  FOR SELECT TO authenticated
  USING (
    auth.uid() = instructor_id OR invitees @> ARRAY[auth.uid()::uuid]
  ); 