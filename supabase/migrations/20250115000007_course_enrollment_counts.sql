-- Function to get courses with real-time enrollment counts
CREATE OR REPLACE FUNCTION get_courses_with_enrollment_counts(
  p_is_published BOOLEAN DEFAULT NULL,
  p_category TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  instructor TEXT,
  instructor_id UUID,
  category TEXT,
  format TEXT,
  duration INTEGER,
  thumbnail TEXT,
  price DECIMAL,
  is_published BOOLEAN,
  enrolled_count BIGINT,
  certificatetemplate TEXT,
  slug TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.title,
    c.description,
    c.instructor,
    c.instructor_id,
    c.category,
    c.format,
    c.duration,
    c.thumbnail,
    c.price,
    c.is_published,
    COALESCE(uc_counts.enrollment_count, 0) as enrolled_count,
    c.certificatetemplate,
    c.slug,
    c.created_at,
    c.updated_at
  FROM courses c
  LEFT JOIN (
    SELECT 
      course_id,
      COUNT(*) as enrollment_count
    FROM user_courses 
    WHERE status = 'enrolled'
    GROUP BY course_id
  ) uc_counts ON c.id = uc_counts.course_id
  WHERE (p_is_published IS NULL OR c.is_published = p_is_published)
    AND (p_category IS NULL OR c.category = p_category)
  ORDER BY c.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_courses_with_enrollment_counts TO authenticated;

-- Create an index on user_courses for better performance
CREATE INDEX IF NOT EXISTS idx_user_courses_course_status ON user_courses(course_id, status); 