-- =============================
-- COURSE RATING & REVIEW SYSTEM MIGRATION
-- =============================

-- Create course_ratings table
CREATE TABLE IF NOT EXISTS course_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id text NOT NULL,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_title text,
  review_content text,
  is_verified_purchase boolean DEFAULT false,
  helpful_votes integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(course_id, user_id) -- One rating per user per course
);

-- Create instructor_ratings table
CREATE TABLE IF NOT EXISTS instructor_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  learner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_content text,
  teaching_quality integer CHECK (teaching_quality >= 1 AND teaching_quality <= 5),
  communication integer CHECK (communication >= 1 AND communication <= 5),
  responsiveness integer CHECK (responsiveness >= 1 AND responsiveness <= 5),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(instructor_id, learner_id, course_id) -- One rating per learner per instructor per course
);

-- Create review_helpful_votes table for tracking helpful votes
CREATE TABLE IF NOT EXISTS review_helpful_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES course_ratings(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_helpful boolean NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(review_id, user_id) -- One vote per user per review
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_course_ratings_course_id ON course_ratings(course_id);
CREATE INDEX IF NOT EXISTS idx_course_ratings_user_id ON course_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_course_ratings_rating ON course_ratings(rating);
CREATE INDEX IF NOT EXISTS idx_instructor_ratings_instructor_id ON instructor_ratings(instructor_id);
CREATE INDEX IF NOT EXISTS idx_instructor_ratings_learner_id ON instructor_ratings(learner_id);
CREATE INDEX IF NOT EXISTS idx_review_helpful_votes_review_id ON review_helpful_votes(review_id);

-- Enable Row Level Security
ALTER TABLE course_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructor_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_helpful_votes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for course_ratings table
CREATE POLICY "Users can view all course ratings"
  ON course_ratings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create their own course ratings"
  ON course_ratings
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own course ratings"
  ON course_ratings
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own course ratings"
  ON course_ratings
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create RLS policies for instructor_ratings table
CREATE POLICY "Users can view all instructor ratings"
  ON instructor_ratings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Learners can create instructor ratings"
  ON instructor_ratings
  FOR INSERT
  TO authenticated
  WITH CHECK (learner_id = auth.uid());

CREATE POLICY "Learners can update their own instructor ratings"
  ON instructor_ratings
  FOR UPDATE
  TO authenticated
  USING (learner_id = auth.uid())
  WITH CHECK (learner_id = auth.uid());

CREATE POLICY "Learners can delete their own instructor ratings"
  ON instructor_ratings
  FOR DELETE
  TO authenticated
  USING (learner_id = auth.uid());

-- Create RLS policies for review_helpful_votes table
CREATE POLICY "Users can view all helpful votes"
  ON review_helpful_votes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create their own helpful votes"
  ON review_helpful_votes
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own helpful votes"
  ON review_helpful_votes
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own helpful votes"
  ON review_helpful_votes
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Function to get course rating statistics
CREATE OR REPLACE FUNCTION get_course_rating_stats(p_course_id text)
RETURNS TABLE(
  total_ratings integer,
  average_rating numeric,
  rating_distribution jsonb,
  verified_purchases integer
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::integer as total_ratings,
    COALESCE(AVG(rating), 0) as average_rating,
    jsonb_build_object(
      '5_star', COUNT(*) FILTER (WHERE rating = 5),
      '4_star', COUNT(*) FILTER (WHERE rating = 4),
      '3_star', COUNT(*) FILTER (WHERE rating = 3),
      '2_star', COUNT(*) FILTER (WHERE rating = 2),
      '1_star', COUNT(*) FILTER (WHERE rating = 1)
    ) as rating_distribution,
    COUNT(*) FILTER (WHERE is_verified_purchase = true)::integer as verified_purchases
  FROM course_ratings
  WHERE course_id = p_course_id;
END;
$$;

-- Function to get instructor rating statistics
CREATE OR REPLACE FUNCTION get_instructor_rating_stats(p_instructor_id uuid)
RETURNS TABLE(
  total_ratings integer,
  average_rating numeric,
  teaching_quality_avg numeric,
  communication_avg numeric,
  responsiveness_avg numeric,
  rating_distribution jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::integer as total_ratings,
    COALESCE(AVG(rating), 0) as average_rating,
    COALESCE(AVG(teaching_quality), 0) as teaching_quality_avg,
    COALESCE(AVG(communication), 0) as communication_avg,
    COALESCE(AVG(responsiveness), 0) as responsiveness_avg,
    jsonb_build_object(
      '5_star', COUNT(*) FILTER (WHERE rating = 5),
      '4_star', COUNT(*) FILTER (WHERE rating = 4),
      '3_star', COUNT(*) FILTER (WHERE rating = 3),
      '2_star', COUNT(*) FILTER (WHERE rating = 2),
      '1_star', COUNT(*) FILTER (WHERE rating = 1)
    ) as rating_distribution
  FROM instructor_ratings
  WHERE instructor_id = p_instructor_id;
END;
$$;

-- Function to check if user can rate a course (must be enrolled and completed)
CREATE OR REPLACE FUNCTION can_rate_course(p_user_id uuid, p_course_id text)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  v_is_enrolled boolean;
  v_is_completed boolean;
BEGIN
  -- Check if user is enrolled in the course
  SELECT EXISTS(
    SELECT 1 FROM user_courses 
    WHERE user_id = p_user_id AND course_id = p_course_id
  ) INTO v_is_enrolled;
  
  -- Check if user has completed the course
  SELECT EXISTS(
    SELECT 1 FROM user_courses 
    WHERE user_id = p_user_id AND course_id = p_course_id AND status = 'completed'
  ) INTO v_is_completed;
  
  RETURN v_is_enrolled AND v_is_completed;
END;
$$;

-- Function to check if user can rate an instructor (must have completed a course by that instructor)
CREATE OR REPLACE FUNCTION can_rate_instructor(p_learner_id uuid, p_instructor_id uuid, p_course_id text)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  v_has_completed boolean;
BEGIN
  -- Check if learner has completed a course by this instructor
  SELECT EXISTS(
    SELECT 1 FROM user_courses uc
    JOIN courses c ON uc.course_id = c.id
    WHERE uc.user_id = p_learner_id 
    AND c.instructor_id = p_instructor_id 
    AND uc.course_id = p_course_id
    AND uc.status = 'completed'
  ) INTO v_has_completed;
  
  RETURN v_has_completed;
END;
$$;

-- Function to mark a course as completed (triggers rating prompt)
CREATE OR REPLACE FUNCTION mark_course_completed(p_user_id uuid, p_course_id text)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_current_status text;
BEGIN
  -- Get current status
  SELECT status INTO v_current_status 
  FROM user_courses 
  WHERE user_id = p_user_id AND course_id = p_course_id;
  
  -- Update to completed if currently enrolled
  IF v_current_status = 'enrolled' THEN
    UPDATE user_courses 
    SET status = 'completed', updated_at = now()
    WHERE user_id = p_user_id AND course_id = p_course_id;
    
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Course marked as completed. You can now rate and review this course!'
    );
  ELSE
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Course is not in enrolled status'
    );
  END IF;
END;
$$;

-- Function to vote on review helpfulness
CREATE OR REPLACE FUNCTION vote_review_helpful(p_review_id uuid, p_user_id uuid, p_is_helpful boolean)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_existing_vote boolean;
BEGIN
  -- Check if user already voted
  SELECT EXISTS(
    SELECT 1 FROM review_helpful_votes 
    WHERE review_id = p_review_id AND user_id = p_user_id
  ) INTO v_existing_vote;
  
  IF v_existing_vote THEN
    -- Update existing vote
    UPDATE review_helpful_votes 
    SET is_helpful = p_is_helpful, created_at = now()
    WHERE review_id = p_review_id AND user_id = p_user_id;
  ELSE
    -- Insert new vote
    INSERT INTO review_helpful_votes (review_id, user_id, is_helpful)
    VALUES (p_review_id, p_user_id, p_is_helpful);
  END IF;
  
  -- Update helpful votes count on the review
  UPDATE course_ratings 
  SET helpful_votes = (
    SELECT COUNT(*) 
    FROM review_helpful_votes 
    WHERE review_id = p_review_id AND is_helpful = true
  )
  WHERE id = p_review_id;
  
  RETURN jsonb_build_object('success', true);
END;
$$; 