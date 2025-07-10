-- Create settings table for platform-wide settings
CREATE TABLE IF NOT EXISTS settings (
  id text PRIMARY KEY, -- e.g. 'general', 'appearance', etc.
  data jsonb NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can read/write settings
CREATE POLICY "Admins can manage settings"
  ON settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  ); 