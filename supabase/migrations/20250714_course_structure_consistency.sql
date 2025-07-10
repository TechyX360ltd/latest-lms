-- Migration: Ensure course structure consistency (UUIDs, FKs, cleanup)
-- Date: 2025-07-14

-- 1. Convert all id and foreign key columns to uuid (if not already)
-- (If already uuid, these will be no-ops)

-- Courses
ALTER TABLE courses ALTER COLUMN id SET DATA TYPE uuid USING id::uuid;

-- Modules
ALTER TABLE modules ALTER COLUMN id SET DATA TYPE uuid USING id::uuid;
ALTER TABLE modules ALTER COLUMN course_id SET DATA TYPE uuid USING course_id::uuid;

-- Lessons
ALTER TABLE lessons ALTER COLUMN id SET DATA TYPE uuid USING id::uuid;
ALTER TABLE lessons ALTER COLUMN course_id SET DATA TYPE uuid USING course_id::uuid;
ALTER TABLE lessons ALTER COLUMN module_id SET DATA TYPE uuid USING module_id::uuid;

-- Assignments
ALTER TABLE assignments ALTER COLUMN id SET DATA TYPE uuid USING id::uuid;
ALTER TABLE assignments ALTER COLUMN course_id SET DATA TYPE uuid USING course_id::uuid;
ALTER TABLE assignments ALTER COLUMN module_id SET DATA TYPE uuid USING module_id::uuid;

-- User Courses
ALTER TABLE user_courses ALTER COLUMN id SET DATA TYPE uuid USING id::uuid;
ALTER TABLE user_courses ALTER COLUMN course_id SET DATA TYPE uuid USING course_id::uuid;
-- If user_id is not uuid, comment out the next line
ALTER TABLE user_courses ALTER COLUMN user_id SET DATA TYPE uuid USING user_id::uuid;

-- Lesson Notes
ALTER TABLE lesson_notes ALTER COLUMN id SET DATA TYPE uuid USING id::uuid;
ALTER TABLE lesson_notes ALTER COLUMN lesson_id SET DATA TYPE uuid USING lesson_id::uuid;
-- If user_id is not uuid, comment out the next line
ALTER TABLE lesson_notes ALTER COLUMN user_id SET DATA TYPE uuid USING user_id::uuid;

-- Lesson Discussions
ALTER TABLE lesson_discussions ALTER COLUMN id SET DATA TYPE uuid USING id::uuid;
ALTER TABLE lesson_discussions ALTER COLUMN lesson_id SET DATA TYPE uuid USING lesson_id::uuid;
-- If user_id is not uuid, comment out the next line
ALTER TABLE lesson_discussions ALTER COLUMN user_id SET DATA TYPE uuid USING user_id::uuid;

-- 2. Add foreign key constraints
ALTER TABLE modules ADD CONSTRAINT fk_modules_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;
ALTER TABLE lessons ADD CONSTRAINT fk_lessons_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;
ALTER TABLE lessons ADD CONSTRAINT fk_lessons_module FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE;
ALTER TABLE assignments ADD CONSTRAINT fk_assignments_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;
ALTER TABLE assignments ADD CONSTRAINT fk_assignments_module FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE;
ALTER TABLE user_courses ADD CONSTRAINT fk_user_courses_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;
ALTER TABLE lesson_notes ADD CONSTRAINT fk_lesson_notes_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE;
-- If user_id is uuid and references auth.users
ALTER TABLE lesson_notes ADD CONSTRAINT fk_lesson_notes_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE lesson_discussions ADD CONSTRAINT fk_lesson_discussions_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE;
-- If user_id is uuid and references auth.users
ALTER TABLE lesson_discussions ADD CONSTRAINT fk_lesson_discussions_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. Remove orphaned records
DELETE FROM modules WHERE course_id NOT IN (SELECT id FROM courses);
DELETE FROM lessons WHERE course_id NOT IN (SELECT id FROM courses) OR module_id NOT IN (SELECT id FROM modules);
DELETE FROM assignments WHERE course_id NOT IN (SELECT id FROM courses) OR module_id NOT IN (SELECT id FROM modules);
DELETE FROM user_courses WHERE course_id NOT IN (SELECT id FROM courses);
DELETE FROM lesson_notes WHERE lesson_id NOT IN (SELECT id FROM lessons);
DELETE FROM lesson_discussions WHERE lesson_id NOT IN (SELECT id FROM lessons);

-- 4. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_modules_course_id ON modules(course_id);
CREATE INDEX IF NOT EXISTS idx_lessons_course_id ON lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_lessons_module_id ON lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_assignments_course_id ON assignments(course_id);
CREATE INDEX IF NOT EXISTS idx_assignments_module_id ON assignments(module_id); 