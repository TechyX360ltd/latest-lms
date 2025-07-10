-- Create extension for UUID generation if not already present
create extension if not exists "pgcrypto";

-- Drop the categories table if it exists (for clean migration; remove this line if you want to preserve data)
drop table if exists categories cascade;

-- Create the categories table
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  icon text,
  color text,
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Drop the courses table if it exists (for clean migration; remove this line if you want to preserve data)
drop table if exists courses cascade;

-- Create the courses table
create table if not exists courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  instructor text not null,
  instructor_id uuid references users(id),
  category_id uuid references categories(id),
  format text not null,
  duration integer not null,
  price numeric not null,
  thumbnail text,
  is_published boolean default false,
  certificatetemplate text default 'default',
  enrolled_count integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
); 