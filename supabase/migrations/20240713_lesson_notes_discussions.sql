-- Migration: Add lesson_notes and lesson_discussions tables for notes and discussion features

-- Table for user notes per lesson
CREATE TABLE IF NOT EXISTS lesson_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id text NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

-- Table for lesson discussions (comments/questions)
CREATE TABLE IF NOT EXISTS lesson_discussions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id text NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content text NOT NULL,
  parent_id uuid REFERENCES lesson_discussions(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_lesson_notes_lesson_user ON lesson_notes(lesson_id, user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_discussions_lesson ON lesson_discussions(lesson_id); 