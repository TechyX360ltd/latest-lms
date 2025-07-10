/*
  # Create users and authentication tables

  1. New Tables
    - `users` - Main users table with profile information
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `email` (text, unique, not null)
      - `phone` (text, not null)
      - `role` (text, not null, check constraint for 'learner' or 'admin')
      - `bio` (text, nullable)
      - `location` (text, nullable)
      - `occupation` (text, nullable)
      - `education` (text, nullable)
      - `avatar_url` (text, nullable)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, nullable)
  
  2. Security
    - Enable RLS on `users` table
    - Add policies for users to manage their own profiles
    - Add policy for admins to view all users
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text NOT NULL,
  role text NOT NULL CHECK (role IN ('learner', 'admin')),
  bio text,
  location text,
  occupation text,
  education text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies
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

-- Admin policy to view all users
CREATE POLICY "Admins can view all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );