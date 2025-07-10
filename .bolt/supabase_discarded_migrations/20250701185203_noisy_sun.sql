/*
  # Fix RLS policies to eliminate infinite recursion

  1. Policy Changes
    - Remove recursive policies that reference the same table they protect
    - Create simpler policies that use auth.uid() directly
    - Ensure admin policies don't create circular dependencies

  2. Security
    - Users can view and update their own profile using auth.uid()
    - Admin operations will be handled through service role key
    - Remove policies that query users table within users table policies
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;

-- Create new non-recursive policies
CREATE POLICY "Users can view their own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow users to insert their own profile during registration
CREATE POLICY "Users can insert their own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Note: Admin access will be handled through service role key in the application
-- This eliminates the need for recursive policies that check user roles