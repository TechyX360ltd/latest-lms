-- Device and Location Logging Migration

-- 1. Create device_logs table if not exists
CREATE TABLE IF NOT EXISTS device_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  device_type text, -- 'desktop', 'mobile', 'tablet'
  city text,
  country text,
  created_at timestamptz DEFAULT now()
);

-- 2. View for device usage analytics
CREATE OR REPLACE VIEW device_usage_analytics AS
SELECT device_type, COUNT(*) AS count
FROM device_logs
GROUP BY device_type;

-- 3. View for location analytics
CREATE OR REPLACE VIEW location_usage_analytics AS
SELECT country, COUNT(*) AS count
FROM device_logs
GROUP BY country
ORDER BY count DESC; 