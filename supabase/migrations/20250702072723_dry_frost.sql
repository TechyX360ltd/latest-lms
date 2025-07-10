/*
  # Recreate Database Tables

  1. Changes
     - Drop existing tables if they exist
     - Recreate users table with proper structure
     - Recreate user_courses table with proper structure
     - Set up Row Level Security policies
     - Add necessary constraints and relationships

  2. Security
     - Enable RLS on all tables
     - Create appropriate policies for different user roles
*/

-- Drop existing tables if they exist (in reverse order of dependencies)
DROP TABLE IF EXISTS user_courses;
DROP TABLE IF EXISTS users;

-- Recreate users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text NOT NULL,
  role text NOT NULL CHECK (role IN ('learner', 'admin', 'instructor')),
  bio text,
  location text,
  occupation text,
  education text,
  avatar_url text,
  payout_email text,
  expertise text,
  is_approved boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can insert their own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view their own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Recreate user_courses table
CREATE TABLE IF NOT EXISTS user_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id text NOT NULL,
  status text NOT NULL DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'completed')),
  progress integer DEFAULT 0,
  last_accessed timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz,
  UNIQUE(user_id, course_id)
);

-- Enable Row Level Security
ALTER TABLE user_courses ENABLE ROW LEVEL SECURITY;

-- Create policies for user_courses table
CREATE POLICY "Users can view their own enrollments"
  ON user_courses
  FOR SELECT
  TO public
  USING (user_id = auth.uid());

CREATE POLICY "Users can enroll in courses"
  ON user_courses
  FOR INSERT
  TO public
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own progress"
  ON user_courses
  FOR UPDATE
  TO public
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admin policies
CREATE POLICY "Admins can manage all users"
  ON users
  FOR ALL
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can view all enrollments"
  ON user_courses
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );