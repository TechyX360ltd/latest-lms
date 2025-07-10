/*
  # Gamification System Migration

  This migration adds the following tables and functionality:
  1. Add gamification fields to users table
  2. Create badges table
  3. Create user_badges table (many-to-many relationship)
  4. Create store_items table
  5. Create user_purchases table
  6. Set up Row Level Security policies
  7. Add necessary constraints and relationships
*/

-- Add gamification fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS points integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS coins integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_streak integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS longest_streak integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_active_date date DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS referral_code text UNIQUE NOT NULL DEFAULT 'T360-' || substr(md5(gen_random_uuid()::text), 1, 8),
ADD COLUMN IF NOT EXISTS referred_by text REFERENCES users(referral_code);

-- Create badges table
CREATE TABLE IF NOT EXISTS badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text NOT NULL,
  icon_url text,
  points_required integer NOT NULL DEFAULT 0,
  category text NOT NULL CHECK (category IN ('achievement', 'participation', 'milestone', 'special')),
  rarity text NOT NULL DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz
);

-- Create user_badges table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id uuid NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at timestamptz DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- Create store_items table
CREATE TABLE IF NOT EXISTS store_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  icon_url text,
  price_coins integer NOT NULL,
  item_type text NOT NULL CHECK (item_type IN ('avatar_frame', 'profile_background', 'certificate_theme', 'course_discount', 'premium_feature')),
  is_active boolean DEFAULT true,
  stock_quantity integer DEFAULT -1, -- -1 means unlimited
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz
);

-- Create user_purchases table
CREATE TABLE IF NOT EXISTS user_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES store_items(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  total_cost integer NOT NULL,
  purchased_at timestamptz DEFAULT now()
);

-- Create gamification_events table for tracking point-earning activities
CREATE TABLE IF NOT EXISTS gamification_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  points_earned integer NOT NULL DEFAULT 0,
  coins_earned integer NOT NULL DEFAULT 0,
  description text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security on all new tables
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_events ENABLE ROW LEVEL SECURITY;

-- Create policies for badges table
CREATE POLICY "Anyone can view active badges"
  ON badges
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Admins can manage badges"
  ON badges
  FOR ALL
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Create policies for user_badges table
CREATE POLICY "Users can view their own badges"
  ON user_badges
  FOR SELECT
  TO public
  USING (user_id = auth.uid());

CREATE POLICY "Users can view other users' badges"
  ON user_badges
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "System can award badges"
  ON user_badges
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Create policies for store_items table
CREATE POLICY "Anyone can view active store items"
  ON store_items
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Admins can manage store items"
  ON store_items
  FOR ALL
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Create policies for user_purchases table
CREATE POLICY "Users can view their own purchases"
  ON user_purchases
  FOR SELECT
  TO public
  USING (user_id = auth.uid());

CREATE POLICY "Users can make purchases"
  ON user_purchases
  FOR INSERT
  TO public
  WITH CHECK (user_id = auth.uid());

-- Create policies for gamification_events table
CREATE POLICY "Users can view their own events"
  ON gamification_events
  FOR SELECT
  TO public
  USING (user_id = auth.uid());

CREATE POLICY "System can create events"
  ON gamification_events
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Admin policies for gamification tables
CREATE POLICY "Admins can view all gamification data"
  ON gamification_events
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can view all purchases"
  ON user_purchases
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Insert default badges
INSERT INTO badges (name, description, icon_url, points_required, category, rarity) VALUES
('First Steps', 'Complete your first course', '/badges/first-steps.png', 0, 'milestone', 'common'),
('Course Explorer', 'Enroll in 5 courses', '/badges/course-explorer.png', 100, 'achievement', 'common'),
('Dedicated Learner', 'Complete 10 courses', '/badges/dedicated-learner.png', 500, 'achievement', 'rare'),
('Streak Master', 'Maintain a 7-day learning streak', '/badges/streak-master.png', 200, 'achievement', 'rare'),
('Perfect Score', 'Get 100% on a course assessment', '/badges/perfect-score.png', 300, 'achievement', 'epic'),
('Early Bird', 'Complete a course within 24 hours of enrollment', '/badges/early-bird.png', 400, 'achievement', 'epic'),
('Community Helper', 'Help 10 other learners', '/badges/community-helper.png', 600, 'participation', 'rare'),
('Certification Champion', 'Earn 5 certificates', '/badges/certification-champion.png', 800, 'milestone', 'epic'),
('Learning Legend', 'Complete 50 courses', '/badges/learning-legend.png', 2000, 'milestone', 'legendary'),
('Platform Pioneer', 'Be among the first 100 users', '/badges/platform-pioneer.png', 1000, 'special', 'legendary');

-- Insert default store items
INSERT INTO store_items (name, description, icon_url, price_coins, item_type) VALUES
('Golden Frame', 'Exclusive golden avatar frame', '/store/golden-frame.png', 500, 'avatar_frame'),
('Premium Background', 'Premium profile background', '/store/premium-bg.png', 300, 'profile_background'),
('Certificate Theme', 'Custom certificate design', '/store/cert-theme.png', 200, 'certificate_theme'),
('Course Discount', '20% off next course purchase', '/store/discount.png', 1000, 'course_discount'),
('Premium Access', 'Access to premium features for 30 days', '/store/premium.png', 1500, 'premium_feature');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON user_badges(badge_id);
CREATE INDEX IF NOT EXISTS idx_user_purchases_user_id ON user_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_user_purchases_item_id ON user_purchases(item_id);
CREATE INDEX IF NOT EXISTS idx_gamification_events_user_id ON gamification_events(user_id);
CREATE INDEX IF NOT EXISTS idx_gamification_events_event_type ON gamification_events(event_type);
CREATE INDEX IF NOT EXISTS idx_gamification_events_created_at ON gamification_events(created_at);

-- Create function to award points and check for badges
CREATE OR REPLACE FUNCTION award_points_and_check_badges(
  p_user_id uuid,
  p_points integer,
  p_coins integer DEFAULT 0,
  p_event_type text DEFAULT 'general',
  p_description text DEFAULT NULL,
  p_metadata jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_points integer;
  v_new_coins integer;
  v_badge_record record;
BEGIN
  -- Update user's points and coins
  UPDATE users 
  SET 
    points = points + p_points,
    coins = coins + p_coins,
    last_active_date = CURRENT_DATE
  WHERE id = p_user_id;
  
  -- Get updated values
  SELECT points, coins INTO v_new_points, v_new_coins
  FROM users WHERE id = p_user_id;
  
  -- Record the event
  INSERT INTO gamification_events (user_id, event_type, points_earned, coins_earned, description, metadata)
  VALUES (p_user_id, p_event_type, p_points, p_coins, p_description, p_metadata);
  
  -- Check for badges that can be awarded
  FOR v_badge_record IN 
    SELECT b.* 
    FROM badges b
    WHERE b.is_active = true
    AND b.points_required <= v_new_points
    AND NOT EXISTS (
      SELECT 1 FROM user_badges ub 
      WHERE ub.user_id = p_user_id AND ub.badge_id = b.id
    )
  LOOP
    -- Award the badge
    INSERT INTO user_badges (user_id, badge_id)
    VALUES (p_user_id, v_badge_record.id);
    
    -- Award bonus points for earning a badge
    PERFORM award_points_and_check_badges(
      p_user_id, 
      50, -- bonus points for earning a badge
      0,
      'badge_earned',
      'Earned badge: ' || v_badge_record.name,
      jsonb_build_object('badge_id', v_badge_record.id, 'badge_name', v_badge_record.name)
    );
  END LOOP;
END;
$$;

-- Create function to update user streak
CREATE OR REPLACE FUNCTION update_user_streak(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_streak integer;
  v_longest_streak integer;
  v_last_active date;
BEGIN
  -- Get current streak info
  SELECT current_streak, longest_streak, last_active_date 
  INTO v_current_streak, v_longest_streak, v_last_active
  FROM users WHERE id = p_user_id;
  
  -- If user was active yesterday, increment streak
  IF v_last_active = CURRENT_DATE - INTERVAL '1 day' THEN
    v_current_streak := v_current_streak + 1;
  -- If user was active today, no change
  ELSIF v_last_active = CURRENT_DATE THEN
    v_current_streak := v_current_streak;
  -- If user missed a day, reset streak
  ELSE
    v_current_streak := 1;
  END IF;
  
  -- Update longest streak if current is longer
  IF v_current_streak > v_longest_streak THEN
    v_longest_streak := v_current_streak;
  END IF;
  
  -- Update user record
  UPDATE users 
  SET 
    current_streak = v_current_streak,
    longest_streak = v_longest_streak,
    last_active_date = CURRENT_DATE
  WHERE id = p_user_id;
  
  -- Check for streak-based badges
  IF v_current_streak = 7 THEN
    PERFORM award_points_and_check_badges(
      p_user_id, 
      200, 
      0, 
      'streak_milestone',
      'Achieved 7-day learning streak',
      jsonb_build_object('streak_days', 7)
    );
  END IF;
END;
$$;

-- Create function to get leaderboard
CREATE OR REPLACE FUNCTION get_leaderboard(p_limit integer DEFAULT 10)
RETURNS TABLE (
  rank integer,
  user_id uuid,
  user_name text,
  user_email text,
  points integer,
  coins integer,
  current_streak integer,
  longest_streak integer,
  badges_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ROW_NUMBER() OVER (ORDER BY u.points DESC, u.coins DESC) as rank,
    u.id as user_id,
    u.name as user_name,
    u.email as user_email,
    u.points,
    u.coins,
    u.current_streak,
    u.longest_streak,
    COUNT(ub.id) as badges_count
  FROM users u
  LEFT JOIN user_badges ub ON u.id = ub.user_id
  WHERE u.role = 'learner' -- Only show learners in leaderboard
  GROUP BY u.id, u.name, u.email, u.points, u.coins, u.current_streak, u.longest_streak
  ORDER BY u.points DESC, u.coins DESC
  LIMIT p_limit;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION award_points_and_check_badges TO public;
GRANT EXECUTE ON FUNCTION update_user_streak TO public;
GRANT EXECUTE ON FUNCTION get_leaderboard TO public;

-- Referral System: Add referral_code and referred_by to users
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
CREATE INDEX IF NOT EXISTS idx_users_referred_by ON users(referred_by);

COMMENT ON COLUMN users.referral_code IS 'Unique referral code for each user, format T360-UNIQUEID';
COMMENT ON COLUMN users.referred_by IS 'Referral code of the user who referred this user';

-- Table to log successful referral events
CREATE TABLE IF NOT EXISTS referral_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid REFERENCES users(id) ON DELETE CASCADE,
  referred_user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  course_id text,
  coins_awarded integer DEFAULT 1000,
  created_at timestamptz DEFAULT now(),
  status text NOT NULL DEFAULT 'pending',
  UNIQUE(referred_user_id)
);

COMMENT ON TABLE referral_events IS 'Logs successful referrals and coin awards.'; 