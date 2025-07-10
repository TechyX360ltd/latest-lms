-- Migration: UUID/FK cleanup and enforcement for course structure
-- Date: 2025-07-14

-- 1. Show invalid UUIDs in all relevant columns
SELECT 'modules.course_id', course_id FROM modules WHERE course_id IS NOT NULL AND course_id !~* '^[0-9a-f-]{8}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{12}$';
SELECT 'lessons.course_id', course_id FROM lessons WHERE course_id IS NOT NULL AND course_id !~* '^[0-9a-f-]{8}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{12}$';
SELECT 'lessons.module_id', module_id FROM lessons WHERE module_id IS NOT NULL AND module_id !~* '^[0-9a-f-]{8}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{12}$';
SELECT 'assignments.course_id', course_id FROM assignments WHERE course_id IS NOT NULL AND course_id !~* '^[0-9a-f-]{8}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{12}$';
SELECT 'assignments.module_id', module_id FROM assignments WHERE module_id IS NOT NULL AND module_id !~* '^[0-9a-f-]{8}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{12}$';
SELECT 'user_courses.course_id', course_id FROM user_courses WHERE course_id IS NOT NULL AND course_id !~* '^[0-9a-f-]{8}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{12}$';
SELECT 'user_courses.user_id', user_id FROM user_courses WHERE user_id IS NOT NULL AND user_id::text !~* '^[0-9a-f-]{8}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{12}$';
SELECT 'lesson_notes.lesson_id', lesson_id FROM lesson_notes WHERE lesson_id IS NOT NULL AND lesson_id !~* '^[0-9a-f-]{8}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{12}$';
SELECT 'lesson_notes.user_id', user_id FROM lesson_notes WHERE user_id IS NOT NULL AND user_id::text !~* '^[0-9a-f-]{8}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{12}$';
SELECT 'lesson_discussions.lesson_id', lesson_id FROM lesson_discussions WHERE lesson_id IS NOT NULL AND lesson_id !~* '^[0-9a-f-]{8}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{12}$';
SELECT 'lesson_discussions.user_id', user_id FROM lesson_discussions WHERE user_id IS NOT NULL AND user_id::text !~* '^[0-9a-f-]{8}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{12}$';

-- 2. Delete rows with invalid UUIDs (if any)
DELETE FROM modules WHERE course_id IS NOT NULL AND course_id !~* '^[0-9a-f-]{8}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{12}$';
DELETE FROM lessons WHERE course_id IS NOT NULL AND course_id !~* '^[0-9a-f-]{8}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{12}$';
DELETE FROM lessons WHERE module_id IS NOT NULL AND module_id !~* '^[0-9a-f-]{8}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{12}$';
DELETE FROM assignments WHERE course_id IS NOT NULL AND course_id !~* '^[0-9a-f-]{8}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{12}$';
DELETE FROM assignments WHERE module_id IS NOT NULL AND module_id !~* '^[0-9a-f-]{8}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{12}$';
DELETE FROM user_courses WHERE course_id IS NOT NULL AND course_id !~* '^[0-9a-f-]{8}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{12}$';
DELETE FROM user_courses WHERE user_id IS NOT NULL AND user_id::text !~* '^[0-9a-f-]{8}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{12}$';
DELETE FROM lesson_notes WHERE lesson_id IS NOT NULL AND lesson_id !~* '^[0-9a-f-]{8}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{12}$';
DELETE FROM lesson_notes WHERE user_id IS NOT NULL AND user_id::text !~* '^[0-9a-f-]{8}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{12}$';
DELETE FROM lesson_discussions WHERE lesson_id IS NOT NULL AND lesson_id !~* '^[0-9a-f-]{8}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{12}$';
DELETE FROM lesson_discussions WHERE user_id IS NOT NULL AND user_id::text !~* '^[0-9a-f-]{8}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{12}$';

-- 3. Convert all relevant columns to uuid
ALTER TABLE modules ALTER COLUMN course_id SET DATA TYPE uuid USING course_id::uuid;
ALTER TABLE lessons ALTER COLUMN course_id SET DATA TYPE uuid USING course_id::uuid;
ALTER TABLE lessons ALTER COLUMN module_id SET DATA TYPE uuid USING module_id::uuid;
ALTER TABLE assignments ALTER COLUMN course_id SET DATA TYPE uuid USING course_id::uuid;
ALTER TABLE assignments ALTER COLUMN module_id SET DATA TYPE uuid USING module_id::uuid;
ALTER TABLE user_courses ALTER COLUMN course_id SET DATA TYPE uuid USING course_id::uuid;
ALTER TABLE user_courses ALTER COLUMN user_id SET DATA TYPE uuid USING user_id::uuid;
ALTER TABLE lesson_notes ALTER COLUMN lesson_id SET DATA TYPE uuid USING lesson_id::uuid;
ALTER TABLE lesson_notes ALTER COLUMN user_id SET DATA TYPE uuid USING user_id::uuid;
ALTER TABLE lesson_discussions ALTER COLUMN lesson_id SET DATA TYPE uuid USING lesson_id::uuid;
ALTER TABLE lesson_discussions ALTER COLUMN user_id SET DATA TYPE uuid USING user_id::uuid;

-- 4. Add foreign key constraints
ALTER TABLE modules ADD CONSTRAINT fk_modules_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;
ALTER TABLE lessons ADD CONSTRAINT fk_lessons_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;
ALTER TABLE lessons ADD CONSTRAINT fk_lessons_module FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE;
ALTER TABLE assignments ADD CONSTRAINT fk_assignments_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;
ALTER TABLE assignments ADD CONSTRAINT fk_assignments_module FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE;
ALTER TABLE user_courses ADD CONSTRAINT fk_user_courses_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;
ALTER TABLE lesson_notes ADD CONSTRAINT fk_lesson_notes_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE;
ALTER TABLE lesson_notes ADD CONSTRAINT fk_lesson_notes_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE lesson_discussions ADD CONSTRAINT fk_lesson_discussions_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE;
ALTER TABLE lesson_discussions ADD CONSTRAINT fk_lesson_discussions_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE; 