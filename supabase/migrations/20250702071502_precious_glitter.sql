/*
  # Create user_courses table for enrollment tracking

  1. New Tables
    - `user_courses` - Tracks user enrollment in courses
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `course_id` (text, foreign key to courses)
      - `status` (text, check constraint for 'enrolled' or 'completed')
      - `progress` (integer, default 0)
      - `last_accessed` (timestamptz, nullable)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, nullable)
  
  2. Security
    - Enable RLS on `user_courses` table
    - Add policies for users to manage their own enrollments
    - Add policy for admins to view all enrollments
*/

-- Create user_courses table
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

-- Create policies
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

-- Admin policy to view all enrollments
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