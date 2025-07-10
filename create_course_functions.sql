-- Drop old functions if they exist (with possible old signatures)
DROP FUNCTION IF EXISTS public.get_basic_courses(uuid, integer, uuid, text, text, text);
DROP FUNCTION IF EXISTS public.get_highest_rated_courses(uuid, integer, uuid, text, text, text);
DROP FUNCTION IF EXISTS public.get_most_popular_courses(uuid, integer, uuid, text, text, text);
DROP FUNCTION IF EXISTS public.get_newest_courses(uuid, integer, uuid, text, text, text);
DROP FUNCTION IF EXISTS public.get_skills_under_2h_courses(uuid, integer, uuid, text, text, text);
DROP FUNCTION IF EXISTS public.get_recently_viewed_courses(uuid, integer, uuid, text, text, text);
DROP FUNCTION IF EXISTS public.get_basic_courses(uuid, integer);
DROP FUNCTION IF EXISTS public.get_highest_rated_courses(uuid, integer);
DROP FUNCTION IF EXISTS public.get_most_popular_courses(uuid, integer);
DROP FUNCTION IF EXISTS public.get_newest_courses(uuid, integer);
DROP FUNCTION IF EXISTS public.get_skills_under_2h_courses(uuid, integer);
DROP FUNCTION IF EXISTS public.get_recently_viewed_courses(uuid, integer);

-- Create get_basic_courses
CREATE OR REPLACE FUNCTION public.get_basic_courses(
  category_id uuid,
  limit_count integer
)
RETURNS TABLE(
  id uuid,
  title text,
  description text,
  instructor text,
  instructor_id uuid,
  category text,
  format text,
  duration integer,
  thumbnail text,
  price numeric,
  is_published boolean,
  enrolled_count integer,
  created_at timestamp without time zone,
  rating numeric
)
LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.title,
    c.description,
    u.first_name || ' ' || u.last_name AS instructor,
    c.instructor_id,
    c.category,
    c.format,
    c.duration,
    c.thumbnail,
    c.price,
    c.is_published,
    c.enrolled_count,
    c.created_at,
    COALESCE(AVG(r.rating), 0) AS rating
  FROM courses c
  JOIN users u ON c.instructor_id = u.id
  LEFT JOIN course_ratings r ON c.id = r.course_id
  WHERE (category_id IS NULL OR c.category = category_id)
    AND c.is_published = TRUE
    -- Add your own logic for 'basic' courses here if needed
  GROUP BY c.id, u.first_name, u.last_name
  ORDER BY c.enrolled_count DESC
  LIMIT limit_count;
END;
$function$;

-- Create get_highest_rated_courses
CREATE OR REPLACE FUNCTION public.get_highest_rated_courses(
  category_id uuid,
  limit_count integer
)
RETURNS TABLE(
  id uuid,
  title text,
  description text,
  instructor text,
  instructor_id uuid,
  category text,
  format text,
  duration integer,
  thumbnail text,
  price numeric,
  is_published boolean,
  enrolled_count integer,
  created_at timestamp without time zone,
  rating numeric
)
LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.title,
    c.description,
    u.first_name || ' ' || u.last_name AS instructor,
    c.instructor_id,
    c.category,
    c.format,
    c.duration,
    c.thumbnail,
    c.price,
    c.is_published,
    c.enrolled_count,
    c.created_at,
    COALESCE(AVG(r.rating), 0) AS rating
  FROM courses c
  JOIN users u ON c.instructor_id = u.id
  LEFT JOIN course_ratings r ON c.id = r.course_id
  WHERE (category_id IS NULL OR c.category = category_id)
    AND c.is_published = TRUE
  GROUP BY c.id, u.first_name, u.last_name
  ORDER BY rating DESC
  LIMIT limit_count;
END;
$function$;

-- Create get_most_popular_courses
CREATE OR REPLACE FUNCTION public.get_most_popular_courses(
  category_id uuid,
  limit_count integer
)
RETURNS TABLE(
  id uuid,
  title text,
  description text,
  instructor text,
  instructor_id uuid,
  category text,
  format text,
  duration integer,
  thumbnail text,
  price numeric,
  is_published boolean,
  enrolled_count integer,
  created_at timestamp without time zone,
  rating numeric
)
LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.title,
    c.description,
    u.first_name || ' ' || u.last_name AS instructor,
    c.instructor_id,
    c.category,
    c.format,
    c.duration,
    c.thumbnail,
    c.price,
    c.is_published,
    c.enrolled_count,
    c.created_at,
    COALESCE(AVG(r.rating), 0) AS rating
  FROM courses c
  JOIN users u ON c.instructor_id = u.id
  LEFT JOIN course_ratings r ON c.id = r.course_id
  WHERE (category_id IS NULL OR c.category = category_id)
    AND c.is_published = TRUE
  GROUP BY c.id, u.first_name, u.last_name
  ORDER BY c.enrolled_count DESC
  LIMIT limit_count;
END;
$function$;

-- Create get_newest_courses
CREATE OR REPLACE FUNCTION public.get_newest_courses(
  category_id uuid,
  limit_count integer
)
RETURNS TABLE(
  id uuid,
  title text,
  description text,
  instructor text,
  instructor_id uuid,
  category text,
  format text,
  duration integer,
  thumbnail text,
  price numeric,
  is_published boolean,
  enrolled_count integer,
  created_at timestamp without time zone,
  rating numeric
)
LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.title,
    c.description,
    u.first_name || ' ' || u.last_name AS instructor,
    c.instructor_id,
    c.category,
    c.format,
    c.duration,
    c.thumbnail,
    c.price,
    c.is_published,
    c.enrolled_count,
    c.created_at,
    COALESCE(AVG(r.rating), 0) AS rating
  FROM courses c
  JOIN users u ON c.instructor_id = u.id
  LEFT JOIN course_ratings r ON c.id = r.course_id
  WHERE (category_id IS NULL OR c.category = category_id)
    AND c.is_published = TRUE
  GROUP BY c.id, u.first_name, u.last_name
  ORDER BY c.created_at DESC
  LIMIT limit_count;
END;
$function$;

-- Create get_skills_under_2h_courses
CREATE OR REPLACE FUNCTION public.get_skills_under_2h_courses(
  category_id uuid,
  limit_count integer
)
RETURNS TABLE(
  id uuid,
  title text,
  description text,
  instructor text,
  instructor_id uuid,
  category text,
  format text,
  duration integer,
  thumbnail text,
  price numeric,
  is_published boolean,
  enrolled_count integer,
  created_at timestamp without time zone,
  rating numeric
)
LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.title,
    c.description,
    u.first_name || ' ' || u.last_name AS instructor,
    c.instructor_id,
    c.category,
    c.format,
    c.duration,
    c.thumbnail,
    c.price,
    c.is_published,
    c.enrolled_count,
    c.created_at,
    COALESCE(AVG(r.rating), 0) AS rating
  FROM courses c
  JOIN users u ON c.instructor_id = u.id
  LEFT JOIN course_ratings r ON c.id = r.course_id
  WHERE (category_id IS NULL OR c.category = category_id)
    AND c.is_published = TRUE
    AND c.duration <= 2
  GROUP BY c.id, u.first_name, u.last_name
  ORDER BY c.enrolled_count DESC
  LIMIT limit_count;
END;
$function$;

-- Create get_recently_viewed_courses
CREATE OR REPLACE FUNCTION public.get_recently_viewed_courses(
  user_id uuid,
  category_id uuid,
  limit_count integer
)
RETURNS TABLE(
  id uuid,
  title text,
  description text,
  instructor text,
  instructor_id uuid,
  category text,
  format text,
  duration integer,
  thumbnail text,
  price numeric,
  is_published boolean,
  enrolled_count integer,
  created_at timestamp without time zone,
  rating numeric
)
LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.title,
    c.description,
    u.first_name || ' ' || u.last_name AS instructor,
    c.instructor_id,
    c.category,
    c.format,
    c.duration,
    c.thumbnail,
    c.price,
    c.is_published,
    c.enrolled_count,
    c.created_at,
    COALESCE(AVG(r.rating), 0) AS rating
  FROM courses c
  JOIN users u ON c.instructor_id = u.id
  LEFT JOIN course_ratings r ON c.id = r.course_id
  JOIN course_views v ON c.id = v.course_id AND v.user_id = user_id
  WHERE (category_id IS NULL OR c.category = category_id)
    AND c.is_published = TRUE
  GROUP BY c.id, u.first_name, u.last_name
  ORDER BY MAX(v.viewed_at) DESC
  LIMIT limit_count;
END;
$function$; 