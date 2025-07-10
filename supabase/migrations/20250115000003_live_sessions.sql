-- LIVE SESSIONS TABLE
CREATE TABLE IF NOT EXISTS live_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  session_date date NOT NULL,
  session_time time NOT NULL,
  duration integer NOT NULL,
  platform text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE live_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to all authenticated users" ON live_sessions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow insert/update/delete for admins" ON live_sessions
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')); 