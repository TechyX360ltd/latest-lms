-- =============================
-- LESSONS TABLE
-- =============================
CREATE TABLE IF NOT EXISTS lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text,
  video_url text,
  duration integer,
  sort_order integer DEFAULT 0,
  is_published boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =============================
-- ASSIGNMENTS TABLE
-- =============================
CREATE TABLE IF NOT EXISTS assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  module_id uuid,
  title text NOT NULL,
  description text,
  instructions text,
  due_date timestamptz,
  max_points integer DEFAULT 100,
  allowed_file_types text[],
  max_file_size integer DEFAULT 10,
  is_required boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =============================
-- RLS POLICIES
-- =============================
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to lessons for all authenticated users"
  ON lessons
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow read access to assignments for all authenticated users"
  ON assignments
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow insert/update/delete for instructors and admins"
  ON lessons
  FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND (role = 'instructor' OR role = 'admin')));

CREATE POLICY "Allow insert/update/delete for instructors and admins"
  ON assignments
  FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND (role = 'instructor' OR role = 'admin'))); 