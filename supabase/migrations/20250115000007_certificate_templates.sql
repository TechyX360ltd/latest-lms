-- =============================
-- CERTIFICATE TEMPLATES MIGRATION
-- =============================

-- Create certificate_templates table
CREATE TABLE IF NOT EXISTS certificate_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  elements jsonb NOT NULL DEFAULT '[]', -- Array of template elements (text, images, etc.)
  background_image text, -- URL to background image
  background_color text DEFAULT '#ffffff',
  border_color text DEFAULT '#2563eb',
  border_width integer DEFAULT 8,
  font_family text DEFAULT 'serif',
  is_active boolean DEFAULT true,
  is_default boolean DEFAULT false,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create certificates table for storing issued certificates
CREATE TABLE IF NOT EXISTS certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  template_id uuid REFERENCES certificate_templates(id),
  issue_date timestamptz DEFAULT now(),
  certificate_url text, -- URL to stored PDF/image
  verification_code text UNIQUE NOT NULL DEFAULT 'SKILLSAGE-' || substr(md5(gen_random_uuid()::text), 1, 8),
  status text DEFAULT 'issued' CHECK (status IN ('issued', 'revoked')),
  created_at timestamptz DEFAULT now()
);

-- Add certificate_template_id to courses table if not exists
ALTER TABLE courses ADD COLUMN IF NOT EXISTS certificate_template_id uuid REFERENCES certificate_templates(id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_certificate_templates_active ON certificate_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_certificates_user_id ON certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_course_id ON certificates(course_id);
CREATE INDEX IF NOT EXISTS idx_certificates_verification_code ON certificates(verification_code);
CREATE INDEX IF NOT EXISTS idx_courses_certificate_template ON courses(certificate_template_id);

-- Enable Row Level Security
ALTER TABLE certificate_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for certificate_templates
CREATE POLICY "Anyone can view active certificate templates"
  ON certificate_templates
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage certificate templates"
  ON certificate_templates
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- RLS Policies for certificates
CREATE POLICY "Users can view their own certificates"
  ON certificates
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Anyone can view certificates for verification"
  ON certificates
  FOR SELECT
  TO public
  USING (status = 'issued');

CREATE POLICY "System can insert certificates"
  ON certificates
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can manage all certificates"
  ON certificates
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Insert default certificate templates
INSERT INTO certificate_templates (id, name, description, elements, background_color, border_color, is_default, is_active) VALUES
(
  gen_random_uuid(),
  'Classic Blue',
  'Traditional blue and white certificate design',
  '[
    {
      "type": "text",
      "id": "title",
      "text": "Certificate of Completion",
      "x": 50,
      "y": 50,
      "fontSize": 40,
      "fontFamily": "serif",
      "fill": "#2563eb",
      "fontWeight": "bold",
      "textAlign": "center",
      "width": 80
    },
    {
      "type": "text",
      "id": "subtitle",
      "text": "This certifies that",
      "x": 50,
      "y": 120,
      "fontSize": 22,
      "fontFamily": "serif",
      "fill": "#374151",
      "textAlign": "center",
      "width": 80
    },
    {
      "type": "text",
      "id": "student_name",
      "text": "{{student_name}}",
      "x": 50,
      "y": 160,
      "fontSize": 32,
      "fontFamily": "serif",
      "fill": "#1f2937",
      "fontWeight": "bold",
      "textAlign": "center",
      "width": 80
    },
    {
      "type": "text",
      "id": "course_text",
      "text": "has successfully completed the course",
      "x": 50,
      "y": 200,
      "fontSize": 22,
      "fontFamily": "serif",
      "fill": "#374151",
      "textAlign": "center",
      "width": 80
    },
    {
      "type": "text",
      "id": "course_name",
      "text": "{{course_name}}",
      "x": 50,
      "y": 240,
      "fontSize": 28,
      "fontFamily": "serif",
      "fill": "#2563eb",
      "fontWeight": "bold",
      "textAlign": "center",
      "width": 80
    },
    {
      "type": "text",
      "id": "date",
      "text": "Date: {{completion_date}}",
      "x": 50,
      "y": 300,
      "fontSize": 18,
      "fontFamily": "serif",
      "fill": "#6b7280",
      "textAlign": "center",
      "width": 80
    },
    {
      "type": "text",
      "id": "cert_id",
      "text": "Certificate ID: {{certificate_id}}",
      "x": 50,
      "y": 330,
      "fontSize": 16,
      "fontFamily": "serif",
      "fill": "#9ca3af",
      "textAlign": "center",
      "width": 80
    },
    {
      "type": "text",
      "id": "footer",
      "text": "SKILL SAGE LMS",
      "x": 50,
      "y": 90,
      "fontSize": 16,
      "fontFamily": "serif",
      "fill": "#9ca3af",
      "textAlign": "right",
      "width": 80
    }
  ]',
  '#ffffff',
  '#2563eb',
  true,
  true
),
(
  gen_random_uuid(),
  'Modern Gradient',
  'Contemporary design with gradient backgrounds',
  '[
    {
      "type": "text",
      "id": "title",
      "text": "Certificate of Completion",
      "x": 50,
      "y": 50,
      "fontSize": 40,
      "fontFamily": "sans-serif",
      "fill": "#7c3aed",
      "fontWeight": "bold",
      "textAlign": "center",
      "width": 80
    },
    {
      "type": "text",
      "id": "subtitle",
      "text": "This is to certify that",
      "x": 50,
      "y": 120,
      "fontSize": 22,
      "fontFamily": "sans-serif",
      "fill": "#374151",
      "textAlign": "center",
      "width": 80
    },
    {
      "type": "text",
      "id": "student_name",
      "text": "{{student_name}}",
      "x": 50,
      "y": 160,
      "fontSize": 32,
      "fontFamily": "sans-serif",
      "fill": "#1f2937",
      "fontWeight": "bold",
      "textAlign": "center",
      "width": 80
    },
    {
      "type": "text",
      "id": "course_text",
      "text": "has successfully completed",
      "x": 50,
      "y": 200,
      "fontSize": 22,
      "fontFamily": "sans-serif",
      "fill": "#374151",
      "textAlign": "center",
      "width": 80
    },
    {
      "type": "text",
      "id": "course_name",
      "text": "{{course_name}}",
      "x": 50,
      "y": 240,
      "fontSize": 28,
      "fontFamily": "sans-serif",
      "fill": "#7c3aed",
      "fontWeight": "bold",
      "textAlign": "center",
      "width": 80
    },
    {
      "type": "text",
      "id": "date",
      "text": "Issued on {{completion_date}}",
      "x": 50,
      "y": 300,
      "fontSize": 18,
      "fontFamily": "sans-serif",
      "fill": "#6b7280",
      "textAlign": "center",
      "width": 80
    },
    {
      "type": "text",
      "id": "cert_id",
      "text": "ID: {{certificate_id}}",
      "x": 50,
      "y": 330,
      "fontSize": 16,
      "fontFamily": "sans-serif",
      "fill": "#9ca3af",
      "textAlign": "center",
      "width": 80
    },
    {
      "type": "text",
      "id": "footer",
      "text": "SKILL SAGE",
      "x": 50,
      "y": 90,
      "fontSize": 16,
      "fontFamily": "sans-serif",
      "fill": "#9ca3af",
      "textAlign": "right",
      "width": 80
    }
  ]',
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  '#7c3aed',
  false,
  true
),
(
  gen_random_uuid(),
  'Elegant Gold',
  'Premium design with gold accents',
  '[
    {
      "type": "text",
      "id": "title",
      "text": "Certificate of Completion",
      "x": 50,
      "y": 50,
      "fontSize": 40,
      "fontFamily": "serif",
      "fill": "#d97706",
      "fontWeight": "bold",
      "textAlign": "center",
      "width": 80
    },
    {
      "type": "text",
      "id": "subtitle",
      "text": "This is to certify that",
      "x": 50,
      "y": 120,
      "fontSize": 22,
      "fontFamily": "serif",
      "fill": "#374151",
      "textAlign": "center",
      "width": 80
    },
    {
      "type": "text",
      "id": "student_name",
      "text": "{{student_name}}",
      "x": 50,
      "y": 160,
      "fontSize": 32,
      "fontFamily": "serif",
      "fill": "#1f2937",
      "fontWeight": "bold",
      "textAlign": "center",
      "width": 80
    },
    {
      "type": "text",
      "id": "course_text",
      "text": "has successfully completed the course",
      "x": 50,
      "y": 200,
      "fontSize": 22,
      "fontFamily": "serif",
      "fill": "#374151",
      "textAlign": "center",
      "width": 80
    },
    {
      "type": "text",
      "id": "course_name",
      "text": "{{course_name}}",
      "x": 50,
      "y": 240,
      "fontSize": 28,
      "fontFamily": "serif",
      "fill": "#d97706",
      "fontWeight": "bold",
      "textAlign": "center",
      "width": 80
    },
    {
      "type": "text",
      "id": "date",
      "text": "Date: {{completion_date}}",
      "x": 50,
      "y": 300,
      "fontSize": 18,
      "fontFamily": "serif",
      "fill": "#6b7280",
      "textAlign": "center",
      "width": 80
    },
    {
      "type": "text",
      "id": "cert_id",
      "text": "Certificate ID: {{certificate_id}}",
      "x": 50,
      "y": 330,
      "fontSize": 16,
      "fontFamily": "serif",
      "fill": "#9ca3af",
      "textAlign": "center",
      "width": 80
    },
    {
      "type": "text",
      "id": "footer",
      "text": "SKILL SAGE LMS",
      "x": 50,
      "y": 90,
      "fontSize": 16,
      "fontFamily": "serif",
      "fill": "#9ca3af",
      "textAlign": "right",
      "width": 80
    }
  ]',
  '#fef3c7',
  '#d97706',
  false,
  true
);

-- Function to get certificate template by ID
CREATE OR REPLACE FUNCTION get_certificate_template(template_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  template_record record;
BEGIN
  SELECT * INTO template_record
  FROM certificate_templates
  WHERE id = template_id AND is_active = true;
  
  IF NOT FOUND THEN
    -- Return default template
    SELECT * INTO template_record
    FROM certificate_templates
    WHERE is_default = true AND is_active = true
    LIMIT 1;
  END IF;
  
  RETURN jsonb_build_object(
    'id', template_record.id,
    'name', template_record.name,
    'description', template_record.description,
    'elements', template_record.elements,
    'background_image', template_record.background_image,
    'background_color', template_record.background_color,
    'border_color', template_record.border_color,
    'border_width', template_record.border_width,
    'font_family', template_record.font_family
  );
END;
$$;

-- Function to verify certificate
CREATE OR REPLACE FUNCTION verify_certificate(verification_code text)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  cert_record record;
  user_record record;
  course_record record;
BEGIN
  SELECT c.*, u.first_name, u.last_name, co.title as course_title
  INTO cert_record
  FROM certificates c
  JOIN users u ON c.user_id = u.id
  JOIN courses co ON c.course_id = co.id
  WHERE c.verification_code = verification_code AND c.status = 'issued';
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Certificate not found or invalid');
  END IF;
  
  RETURN jsonb_build_object(
    'valid', true,
    'certificate', jsonb_build_object(
      'id', cert_record.id,
      'student_name', cert_record.first_name || ' ' || cert_record.last_name,
      'course_name', cert_record.course_title,
      'issue_date', cert_record.issue_date,
      'verification_code', cert_record.verification_code
    )
  );
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_certificate_template TO public;
GRANT EXECUTE ON FUNCTION verify_certificate TO public; 