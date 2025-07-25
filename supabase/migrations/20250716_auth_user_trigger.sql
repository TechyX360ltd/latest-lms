-- Migration: Create trigger to sync auth.users to users table
-- Date: 2025-07-16

-- 1. Create the function that inserts into users after a new auth.users row
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
  v_email text;
  v_first_name text;
  v_last_name text;
  v_role text;
BEGIN
  -- Extract metadata if available
  v_email := NEW.email;
  v_first_name := COALESCE(NEW.raw_user_meta_data->>'first_name', '');
  v_last_name := COALESCE(NEW.raw_user_meta_data->>'last_name', '');
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'learner');

  -- Insert into users table if not already present
  INSERT INTO public.users (id, email, first_name, last_name, role, created_at)
  VALUES (NEW.id, v_email, v_first_name, v_last_name, v_role, NOW())
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user(); 