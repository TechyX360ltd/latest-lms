/*
  # Initial Schema Setup for TECHYX 360 LMS

  1. New Tables
    - `users` - User accounts and profiles
    - `courses` - Course information
    - `modules` - Course modules
    - `lessons` - Course lessons
    - `schools` - Course categories/schools
    - `user_courses` - User enrollment and progress
    - `assignments` - Course assignments
    - `assignment_submissions` - User assignment submissions
    - `submission_files` - Files attached to submissions
    - `notifications` - System notifications
    - `notification_recipients` - Notification recipients
    - `notification_attachments` - Files attached to notifications
    - `notification_replies` - Replies to notifications
    - `certificates` - User certificates
    - `payments` - Course payment records
  
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('learner', 'admin')),
  bio TEXT,
  location TEXT,
  occupation TEXT,
  education TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- Schools Table (Categories)
CREATE TABLE IF NOT EXISTS schools (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  course_count INTEGER DEFAULT 0,
  student_count INTEGER DEFAULT 0,
  instructor_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- Courses Table
CREATE TABLE IF NOT EXISTS courses (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  instructor TEXT NOT NULL,
  category TEXT NOT NULL REFERENCES schools(id),
  format TEXT NOT NULL CHECK (format IN ('text', 'video', 'mixed')),
  duration INTEGER NOT NULL, -- in hours
  thumbnail TEXT NOT NULL,
  price INTEGER NOT NULL,
  is_published BOOLEAN DEFAULT FALSE,
  enrolled_count INTEGER DEFAULT 0,
  certificate_template TEXT CHECK (certificate_template IN ('default', 'modern', 'elegant')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- Modules Table
CREATE TABLE IF NOT EXISTS modules (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- Lessons Table
CREATE TABLE IF NOT EXISTS lessons (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  module_id TEXT REFERENCES modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  video_url TEXT,
  duration INTEGER, -- in minutes
  sort_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- User Courses Table (Enrollments)
CREATE TABLE IF NOT EXISTS user_courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('enrolled', 'completed')) DEFAULT 'enrolled',
  progress INTEGER DEFAULT 0,
  last_accessed TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  UNIQUE(user_id, course_id)
);

-- Assignments Table
CREATE TABLE IF NOT EXISTS assignments (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  instructions TEXT NOT NULL,
  due_date TIMESTAMPTZ NOT NULL,
  max_points INTEGER NOT NULL,
  allowed_file_types TEXT[] NOT NULL,
  max_file_size INTEGER NOT NULL, -- in MB
  module_id TEXT REFERENCES modules(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  is_required BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- Assignment Submissions Table
CREATE TABLE IF NOT EXISTS assignment_submissions (
  id TEXT PRIMARY KEY,
  assignment_id TEXT NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  submitted_at TIMESTAMPTZ NOT NULL,
  text_submission TEXT,
  status TEXT NOT NULL CHECK (status IN ('submitted', 'graded', 'late', 'missing')) DEFAULT 'submitted',
  grade INTEGER,
  feedback TEXT,
  graded_at TIMESTAMPTZ,
  graded_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  UNIQUE(assignment_id, user_id)
);

-- Submission Files Table
CREATE TABLE IF NOT EXISTS submission_files (
  id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL REFERENCES assignment_submissions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  size INTEGER NOT NULL,
  url TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error', 'announcement')),
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  sender_id UUID NOT NULL REFERENCES users(id),
  course_id TEXT REFERENCES courses(id) ON DELETE CASCADE,
  scheduled_for TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- Notification Recipients Table
CREATE TABLE IF NOT EXISTS notification_recipients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  notification_id TEXT NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  is_starred BOOLEAN DEFAULT FALSE,
  starred_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(notification_id, user_id)
);

-- Notification Attachments Table
CREATE TABLE IF NOT EXISTS notification_attachments (
  id TEXT PRIMARY KEY,
  notification_id TEXT NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  size INTEGER NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification Replies Table
CREATE TABLE IF NOT EXISTS notification_replies (
  id TEXT PRIMARY KEY,
  notification_id TEXT NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Certificates Table
CREATE TABLE IF NOT EXISTS certificates (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  issue_date TIMESTAMPTZ NOT NULL,
  template TEXT NOT NULL CHECK (template IN ('default', 'modern', 'elegant')),
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

-- Payments Table
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE submission_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies

-- Users Policies
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Schools Policies
CREATE POLICY "Anyone can view active schools"
  ON schools FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage schools"
  ON schools FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Courses Policies
CREATE POLICY "Anyone can view published courses"
  ON courses FOR SELECT
  USING (is_published = true);

CREATE POLICY "Admins can manage all courses"
  ON courses FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Modules Policies
CREATE POLICY "Anyone can view modules of published courses"
  ON modules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM courses 
      WHERE courses.id = modules.course_id 
      AND courses.is_published = true
    )
  );

CREATE POLICY "Admins can manage all modules"
  ON modules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Lessons Policies
CREATE POLICY "Enrolled users can view lessons"
  ON lessons FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_courses
      WHERE user_courses.user_id = auth.uid()
      AND user_courses.course_id = lessons.course_id
    ) OR
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage all lessons"
  ON lessons FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- User Courses Policies
CREATE POLICY "Users can view their own enrollments"
  ON user_courses FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all enrollments"
  ON user_courses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can enroll in courses"
  ON user_courses FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own progress"
  ON user_courses FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Assignments Policies
CREATE POLICY "Enrolled users can view assignments"
  ON assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_courses
      WHERE user_courses.user_id = auth.uid()
      AND user_courses.course_id = assignments.course_id
    ) OR
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage assignments"
  ON assignments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Assignment Submissions Policies
CREATE POLICY "Users can view their own submissions"
  ON assignment_submissions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all submissions"
  ON assignment_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can submit assignments"
  ON assignment_submissions FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Submission Files Policies
CREATE POLICY "Users can view their own submission files"
  ON submission_files FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM assignment_submissions
      WHERE assignment_submissions.id = submission_files.submission_id
      AND assignment_submissions.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all submission files"
  ON submission_files FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can upload submission files"
  ON submission_files FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM assignment_submissions
      WHERE assignment_submissions.id = submission_id
      AND assignment_submissions.user_id = auth.uid()
    )
  );

-- Notifications Policies
CREATE POLICY "Users can view notifications addressed to them"
  ON notifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM notification_recipients
      WHERE notification_recipients.notification_id = notifications.id
      AND notification_recipients.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Notification Recipients Policies
CREATE POLICY "Users can view their own notification status"
  ON notification_recipients FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notification status"
  ON notification_recipients FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Notification Attachments Policies
CREATE POLICY "Users can view notification attachments"
  ON notification_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM notification_recipients
      JOIN notifications ON notifications.id = notification_recipients.notification_id
      WHERE notifications.id = notification_attachments.notification_id
      AND notification_recipients.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Notification Replies Policies
CREATE POLICY "Users can view notification replies"
  ON notification_replies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM notification_recipients
      JOIN notifications ON notifications.id = notification_recipients.notification_id
      WHERE notifications.id = notification_replies.notification_id
      AND notification_recipients.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can reply to notifications"
  ON notification_replies FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM notification_recipients
      WHERE notification_recipients.notification_id = notification_id
      AND notification_recipients.user_id = auth.uid()
    )
  );

-- Certificates Policies
CREATE POLICY "Users can view their own certificates"
  ON certificates FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all certificates"
  ON certificates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Payments Policies
CREATE POLICY "Users can view their own payments"
  ON payments FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all payments"
  ON payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can create payments"
  ON payments FOR INSERT
  WITH CHECK (user_id = auth.uid());
