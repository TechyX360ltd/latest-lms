-- GAMIFICATION SYSTEM CLEAN MIGRATION
-- Drops and recreates all gamification-related tables and columns for a fresh start

-- 1. DROP TABLES (order matters due to foreign keys)
drop table if exists user_purchases cascade;
drop table if exists user_badges cascade;
drop table if exists gamification_events cascade;
drop table if exists store_items cascade;
drop table if exists badges cascade;

-- 2. BADGES TABLE
create table public.badges (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  icon_url text,
  points_required integer not null default 0,
  category text not null, -- e.g. 'achievement', 'participation', 'milestone', 'special'
  rarity text not null,   -- e.g. 'common', 'rare', 'epic', 'legendary'
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

-- 3. USER BADGES TABLE
create table public.user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  badge_id uuid references public.badges(id) on delete cascade,
  earned_at timestamptz not null default now()
);

-- 4. STORE ITEMS TABLE
create table public.store_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  icon_url text,
  price integer not null default 0,
  item_type text not null, -- e.g. 'avatar_frame', 'profile_background', etc.
  is_active boolean not null default true,
  stock_quantity integer not null default -1, -- -1 means unlimited
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

-- 5. USER PURCHASES TABLE
create table public.user_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  item_id uuid references public.store_items(id) on delete cascade,
  quantity integer not null default 1,
  total_cost integer not null default 0,
  purchased_at timestamptz not null default now()
);

-- 6. GAMIFICATION EVENTS TABLE
create table public.gamification_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  event_type text not null,
  points_earned integer not null default 0,
  coins_earned integer not null default 0,
  description text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- 7. ADD GAMIFICATION COLUMNS TO USERS TABLE
alter table public.users
  add column if not exists points integer not null default 0,
  add column if not exists coins integer not null default 0,
  add column if not exists current_streak integer not null default 0,
  add column if not exists longest_streak integer not null default 0,
  add column if not exists last_active_date timestamptz,
  add column if not exists avatar_url text;

-- 8. INDEXES FOR PERFORMANCE
create index if not exists idx_user_badges_user_id on public.user_badges(user_id);
create index if not exists idx_user_badges_badge_id on public.user_badges(badge_id);
create index if not exists idx_user_purchases_user_id on public.user_purchases(user_id);
create index if not exists idx_user_purchases_item_id on public.user_purchases(item_id);
create index if not exists idx_gamification_events_user_id on public.gamification_events(user_id);

-- 9. ENABLE ROW LEVEL SECURITY
alter table public.badges enable row level security;
alter table public.user_badges enable row level security;
alter table public.store_items enable row level security;
alter table public.user_purchases enable row level security;
alter table public.gamification_events enable row level security;

-- 10. CREATE POLICIES FOR GAMIFICATION EVENTS
-- Allow users to view their own events
create policy "Users can view their own gamification events"
  on public.gamification_events
  for select
  using (auth.uid() = user_id);

-- Allow system to create events
create policy "System can create gamification events"
  on public.gamification_events
  for insert
  with check (true);

-- Allow admins to view all events
create policy "Admins can view all gamification events"
  on public.gamification_events
  for select
  using (
    exists (
      select 1 from public.users
      where users.id = auth.uid() and users.role = 'admin'
    )
  );

-- Allow admins to update events
create policy "Admins can update gamification events"
  on public.gamification_events
  for update
  using (
    exists (
      select 1 from public.users
      where users.id = auth.uid() and users.role = 'admin'
    )
  );

-- Allow admins to delete events
create policy "Admins can delete gamification events"
  on public.gamification_events
  for delete
  using (
    exists (
      select 1 from public.users
      where users.id = auth.uid() and users.role = 'admin'
    )
  );

-- 11. CREATE POLICIES FOR OTHER TABLES
-- Badges policies
create policy "Anyone can view active badges"
  on public.badges
  for select
  using (is_active = true);

create policy "Admins can manage badges"
  on public.badges
  for all
  using (
    exists (
      select 1 from public.users
      where users.id = auth.uid() and users.role = 'admin'
    )
  );

-- User badges policies
create policy "Users can view their own badges"
  on public.user_badges
  for select
  using (auth.uid() = user_id);

create policy "System can award badges"
  on public.user_badges
  for insert
  with check (true);

-- Store items policies
create policy "Anyone can view active store items"
  on public.store_items
  for select
  using (is_active = true);

create policy "Admins can manage store items"
  on public.store_items
  for all
  using (
    exists (
      select 1 from public.users
      where users.id = auth.uid() and users.role = 'admin'
    )
  );

-- User purchases policies
create policy "Users can view their own purchases"
  on public.user_purchases
  for select
  using (auth.uid() = user_id);

create policy "Users can make purchases"
  on public.user_purchases
  for insert
  with check (auth.uid() = user_id);

-- 12. DEFAULT BADGE AND STORE ITEM
insert into public.badges (id, name, description, points_required, category, rarity, is_active)
values (gen_random_uuid(), 'First Course', 'Complete your first course', 10, 'achievement', 'common', true)
on conflict do nothing;

insert into public.store_items (id, name, description, price, item_type, is_active, stock_quantity)
values (gen_random_uuid(), 'Gold Avatar Frame', 'A shiny gold frame for your profile picture', 100, 'avatar_frame', true, -1)
on conflict do nothing;

-- 13. SAMPLE GAMIFICATION EVENTS (for testing)
-- Note: Replace these user_ids with actual user IDs from your system
insert into public.gamification_events (user_id, event_type, points_earned, coins_earned, description, metadata)
values 
  ('00000000-0000-0000-0000-000000000001', 'course_enrollment', 10, 5, 'Enrolled in Introduction to Programming', '{"course_id": "course-1", "course_name": "Introduction to Programming"}'),
  ('00000000-0000-0000-0000-000000000001', 'course_completion', 50, 25, 'Completed Introduction to Programming', '{"course_id": "course-1", "course_name": "Introduction to Programming"}'),
  ('00000000-0000-0000-0000-000000000002', 'daily_login', 5, 2, 'Daily login streak', '{"streak_days": 3}'),
  ('00000000-0000-0000-0000-000000000002', 'assignment_submission', 15, 8, 'Submitted assignment for Module 2', '{"assignment_id": "assign-1", "module": "Module 2"}'),
  ('00000000-0000-0000-0000-000000000003', 'course_enrollment', 10, 5, 'Enrolled in Advanced JavaScript', '{"course_id": "course-2", "course_name": "Advanced JavaScript"}'),
  ('00000000-0000-0000-0000-000000000003', 'perfect_score', 30, 15, 'Achieved perfect score on quiz', '{"quiz_id": "quiz-1", "score": 100}'),
  ('00000000-0000-0000-0000-000000000004', 'streak_milestone', 20, 10, 'Reached 7-day learning streak', '{"streak_days": 7}'),
  ('00000000-0000-0000-0000-000000000004', 'course_enrollment', 10, 5, 'Enrolled in Data Science Fundamentals', '{"course_id": "course-3", "course_name": "Data Science Fundamentals"}')
on conflict do nothing; 