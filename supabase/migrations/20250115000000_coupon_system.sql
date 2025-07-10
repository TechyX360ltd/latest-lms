-- =============================
-- COUPON SYSTEM MIGRATION
-- =============================

-- Create coupons table
CREATE TABLE IF NOT EXISTS coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  discount_type text NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
  discount_value numeric NOT NULL CHECK (discount_value > 0),
  minimum_purchase numeric DEFAULT 0,
  maximum_discount numeric,
  usage_limit integer DEFAULT 1,
  used_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  valid_from timestamptz DEFAULT now(),
  valid_until timestamptz,
  applicable_courses uuid[], -- Array of course IDs, empty means all courses
  applicable_categories uuid[], -- Array of category IDs, empty means all categories
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create coupon_usage table to track coupon usage
CREATE TABLE IF NOT EXISTS coupon_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id uuid NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id text NOT NULL,
  original_amount numeric NOT NULL,
  discount_amount numeric NOT NULL,
  final_amount numeric NOT NULL,
  used_at timestamptz DEFAULT now(),
  payment_reference text, -- Reference to payment transaction
  UNIQUE(coupon_id, user_id, course_id) -- Prevent multiple uses of same coupon for same user/course
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(is_active);
CREATE INDEX IF NOT EXISTS idx_coupons_valid_until ON coupons(valid_until);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_user_id ON coupon_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_coupon_id ON coupon_usage(coupon_id);

-- Enable Row Level Security
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usage ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for coupons table
CREATE POLICY "Admins can manage all coupons"
  ON coupons
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Users can view active coupons"
  ON coupons
  FOR SELECT
  TO authenticated
  USING (
    is_active = true AND 
    (valid_until IS NULL OR valid_until > now()) AND
    (valid_from IS NULL OR valid_from <= now())
  );

-- Create RLS policies for coupon_usage table
CREATE POLICY "Users can view their own coupon usage"
  ON coupon_usage
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own coupon usage"
  ON coupon_usage
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all coupon usage"
  ON coupon_usage
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Function to validate and apply coupon
CREATE OR REPLACE FUNCTION validate_and_apply_coupon(
  p_coupon_code text,
  p_user_id uuid,
  p_course_id text,
  p_original_amount numeric
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_coupon coupons%ROWTYPE;
  v_discount_amount numeric;
  v_final_amount numeric;
  v_usage_count integer;
  v_already_used integer;
  v_course_category uuid;
BEGIN
  -- Get coupon details
  SELECT * INTO v_coupon 
  FROM coupons 
  WHERE code = p_coupon_code AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Invalid coupon code');
  END IF;
  
  -- Check if coupon is expired
  IF v_coupon.valid_until IS NOT NULL AND v_coupon.valid_until < now() THEN
    RETURN jsonb_build_object('error', 'Coupon has expired');
  END IF;
  
  -- Check if coupon is not yet valid
  IF v_coupon.valid_from IS NOT NULL AND v_coupon.valid_from > now() THEN
    RETURN jsonb_build_object('error', 'Coupon is not yet valid');
  END IF;
  
  -- Check minimum purchase amount
  IF p_original_amount < v_coupon.minimum_purchase THEN
    RETURN jsonb_build_object('error', 'Minimum purchase amount not met');
  END IF;
  
  -- Check if user has already used this coupon for this course
  SELECT COUNT(*) INTO v_already_used 
  FROM coupon_usage 
  WHERE coupon_id = v_coupon.id AND user_id = p_user_id AND course_id = p_course_id;
  
  IF v_already_used > 0 THEN
    RETURN jsonb_build_object('error', 'Coupon already used for this course');
  END IF;
  
  -- Check usage limit
  IF v_coupon.usage_limit IS NOT NULL THEN
    SELECT COUNT(*) INTO v_usage_count 
    FROM coupon_usage 
    WHERE coupon_id = v_coupon.id;
    
    IF v_usage_count >= v_coupon.usage_limit THEN
      RETURN jsonb_build_object('error', 'Coupon usage limit reached');
    END IF;
  END IF;
  
  -- Check applicable courses
  IF v_coupon.applicable_courses IS NOT NULL AND array_length(v_coupon.applicable_courses, 1) > 0 THEN
    IF NOT (p_course_id::uuid = ANY(v_coupon.applicable_courses)) THEN
      RETURN jsonb_build_object('error', 'Coupon not applicable to this course');
    END IF;
  END IF;
  
  -- Check applicable categories
  IF v_coupon.applicable_categories IS NOT NULL AND array_length(v_coupon.applicable_categories, 1) > 0 THEN
    SELECT category_id INTO v_course_category FROM courses WHERE id = p_course_id;
    IF v_course_category IS NULL OR NOT (v_course_category = ANY(v_coupon.applicable_categories)) THEN
      RETURN jsonb_build_object('error', 'Coupon not applicable to this course category');
    END IF;
  END IF;
  
  -- Calculate discount
  IF v_coupon.discount_type = 'percentage' THEN
    v_discount_amount = (p_original_amount * v_coupon.discount_value) / 100;
    IF v_coupon.maximum_discount IS NOT NULL AND v_discount_amount > v_coupon.maximum_discount THEN
      v_discount_amount = v_coupon.maximum_discount;
    END IF;
  ELSE
    v_discount_amount = v_coupon.discount_value;
  END IF;
  
  -- Ensure discount doesn't exceed original amount
  IF v_discount_amount > p_original_amount THEN
    v_discount_amount = p_original_amount;
  END IF;
  
  v_final_amount = p_original_amount - v_discount_amount;
  
  -- Record coupon usage
  INSERT INTO coupon_usage (
    coupon_id, 
    user_id, 
    course_id, 
    original_amount, 
    discount_amount, 
    final_amount
  ) VALUES (
    v_coupon.id,
    p_user_id,
    p_course_id,
    p_original_amount,
    v_discount_amount,
    v_final_amount
  );
  
  -- Update coupon usage count
  UPDATE coupons 
  SET used_count = used_count + 1, updated_at = now()
  WHERE id = v_coupon.id;
  
  RETURN jsonb_build_object(
    'success', true,
    'coupon_id', v_coupon.id,
    'coupon_name', v_coupon.name,
    'discount_type', v_coupon.discount_type,
    'discount_value', v_coupon.discount_value,
    'discount_amount', v_discount_amount,
    'original_amount', p_original_amount,
    'final_amount', v_final_amount
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('error', 'Failed to apply coupon: ' || SQLERRM);
END;
$$;

-- Function to get available coupons for a user
CREATE OR REPLACE FUNCTION get_available_coupons(
  p_user_id uuid,
  p_course_id text DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  code text,
  name text,
  description text,
  discount_type text,
  discount_value numeric,
  minimum_purchase numeric,
  maximum_discount numeric,
  valid_until timestamptz
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.code,
    c.name,
    c.description,
    c.discount_type,
    c.discount_value,
    c.minimum_purchase,
    c.maximum_discount,
    c.valid_until
  FROM coupons c
  WHERE c.is_active = true
    AND (c.valid_until IS NULL OR c.valid_until > now())
    AND (c.valid_from IS NULL OR c.valid_from <= now())
    AND (c.usage_limit IS NULL OR c.used_count < c.usage_limit)
    AND (
      -- Check if user hasn't used this coupon for the specific course
      p_course_id IS NULL OR 
      NOT EXISTS (
        SELECT 1 FROM coupon_usage cu 
        WHERE cu.coupon_id = c.id 
        AND cu.user_id = p_user_id 
        AND cu.course_id = p_course_id
      )
    )
    AND (
      -- Check applicable courses
      c.applicable_courses IS NULL OR 
      array_length(c.applicable_courses, 1) IS NULL OR
      (p_course_id IS NOT NULL AND p_course_id::uuid = ANY(c.applicable_courses))
    )
  ORDER BY c.created_at DESC;
END;
$$;

-- Function to get coupon statistics for admin
CREATE OR REPLACE FUNCTION get_coupon_statistics()
RETURNS TABLE(
  total_coupons integer,
  active_coupons integer,
  expired_coupons integer,
  total_usage integer,
  total_discount_given numeric
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::integer as total_coupons,
    COUNT(*) FILTER (WHERE is_active = true AND (valid_until IS NULL OR valid_until > now()))::integer as active_coupons,
    COUNT(*) FILTER (WHERE valid_until IS NOT NULL AND valid_until < now())::integer as expired_coupons,
    COALESCE(SUM(used_count), 0)::integer as total_usage,
    COALESCE(SUM(cu.discount_amount), 0) as total_discount_given
  FROM coupons c
  LEFT JOIN coupon_usage cu ON c.id = cu.coupon_id;
END;
$$; 