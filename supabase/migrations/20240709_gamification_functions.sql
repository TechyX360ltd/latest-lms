-- GAMIFICATION FUNCTIONS CLEAN MIGRATION
-- Drops and recreates all gamification-related functions for a fresh start

-- 1. DROP FUNCTIONS IF THEY EXIST
DROP FUNCTION IF EXISTS public.award_points_and_check_badges(uuid, integer, integer, text, text, jsonb);
DROP FUNCTION IF EXISTS public.update_user_streak(uuid);
DROP FUNCTION IF EXISTS public.get_leaderboard(integer);
DROP FUNCTION IF EXISTS public.award_daily_login_points(uuid);
DROP FUNCTION IF EXISTS public.award_course_completion_points(uuid, uuid);

-- 2. award_points_and_check_badges
CREATE OR REPLACE FUNCTION public.award_points_and_check_badges(
  p_user_id uuid,
  p_points integer,
  p_coins integer,
  p_event_type text,
  p_description text default null,
  p_metadata jsonb default null
)
RETURNS void AS $$
DECLARE
  v_total_points integer;
  v_badge_id uuid;
BEGIN
  -- Update user points and coins
  UPDATE users
    SET points = points + p_points,
        coins = coins + p_coins
    WHERE id = p_user_id;

  -- Log the event
  INSERT INTO gamification_events (user_id, event_type, points_earned, coins_earned, description, metadata)
    VALUES (p_user_id, p_event_type, p_points, p_coins, p_description, p_metadata);

  -- Check for new badges
  SELECT points INTO v_total_points FROM users WHERE id = p_user_id;
  FOR v_badge_id IN
    SELECT id FROM badges WHERE is_active = true AND points_required <= v_total_points
    AND id NOT IN (SELECT badge_id FROM user_badges WHERE user_id = p_user_id)
  LOOP
    INSERT INTO user_badges (user_id, badge_id) VALUES (p_user_id, v_badge_id);
    -- Optionally, log a badge_earned event
    INSERT INTO gamification_events (user_id, event_type, points_earned, coins_earned, description)
      VALUES (p_user_id, 'badge_earned', 0, 0, 'Earned a new badge');
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 3. update_user_streak
CREATE OR REPLACE FUNCTION public.update_user_streak(p_user_id uuid)
RETURNS void AS $$
DECLARE
  v_last_active timestamptz;
  v_current_streak integer;
  v_longest_streak integer;
BEGIN
  SELECT last_active_date, current_streak, longest_streak
    INTO v_last_active, v_current_streak, v_longest_streak
    FROM users WHERE id = p_user_id;

  IF v_last_active IS NULL OR v_last_active < (now()::date - interval '1 day') THEN
    -- Missed a day, reset streak
    UPDATE users SET current_streak = 1, last_active_date = now() WHERE id = p_user_id;
  ELSIF v_last_active::date = (now()::date - interval '1 day') THEN
    -- Continuing streak
    UPDATE users
      SET current_streak = current_streak + 1,
          longest_streak = GREATEST(longest_streak, current_streak + 1),
          last_active_date = now()
      WHERE id = p_user_id;
  ELSE
    -- Already logged in today, do nothing
    NULL;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 4. get_leaderboard
CREATE OR REPLACE FUNCTION public.get_leaderboard(p_limit integer default 10)
RETURNS TABLE (
  rank integer,
  user_id uuid,
  user_name text,
  user_email text,
  points integer,
  coins integer,
  current_streak integer,
  longest_streak integer,
  badges_count integer
) AS $$
BEGIN
  RETURN QUERY
    SELECT
      row_number() OVER (ORDER BY u.points DESC)::integer AS rank, -- Cast to integer for Supabase compatibility
      u.id,
      u.first_name || ' ' || u.last_name AS user_name,
      u.email,
      u.points,
      u.coins,
      u.current_streak,
      u.longest_streak,
      (SELECT count(*) FROM user_badges b WHERE b.user_id = u.id) AS badges_count
    FROM users u
    ORDER BY u.points DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- 5. award_daily_login_points (helper)
CREATE OR REPLACE FUNCTION public.award_daily_login_points(p_user_id uuid)
RETURNS void AS $$
BEGIN
  PERFORM public.update_user_streak(p_user_id);
  PERFORM public.award_points_and_check_badges(
    p_user_id,
    5, -- points for daily login
    2, -- coins for daily login
    'daily_login',
    'Daily login bonus'
  );
END;
$$ LANGUAGE plpgsql;

-- 6. award_course_completion_points (helper)
CREATE OR REPLACE FUNCTION public.award_course_completion_points(p_user_id uuid, p_course_id uuid)
RETURNS void AS $$
BEGIN
  PERFORM public.award_points_and_check_badges(
    p_user_id,
    100, -- points for course completion
    50,  -- coins for course completion
    'course_completed',
    'Completed a course',
    jsonb_build_object('course_id', p_course_id)
  );
END;
$$ LANGUAGE plpgsql; 