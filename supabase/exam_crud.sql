-- SQL for Exam table + CRUD RPCs for Supabase
-- Creates the `exam` table, Row Level Security policies, and
-- RPC wrappers that rely on RLS so only instructors assigned to
-- a course can create/update/delete exams for that course.

-- Note: this file assumes the `public.course`, `public.user`, and
-- `public.user_course` tables already exist. It also assumes the
-- `pgcrypto` extension (for gen_random_uuid()) is available; if not
-- you can use `uuid_generate_v4()` if that extension exists instead.

-- 1) Create the table (id types assume UUID for course and user ids)
CREATE TABLE IF NOT EXISTS public.exam (
    exam_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id uuid NOT NULL REFERENCES public.courses(course_id) ON DELETE CASCADE,
    exam_title text NOT NULL,
    exam_date timestamptz,
    passing_rate numeric,
    topics text[],
    created_by uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- 2) Enable Row Level Security
ALTER TABLE IF EXISTS public.exam ENABLE ROW LEVEL SECURITY;

-- 3) Policies
-- Helper note: these policies use auth.uid() (supabase-provided) which
-- returns the current authenticated user's id (string). We cast to uuid.

-- Allow SELECT only for users that are linked to the course in user_course
CREATE POLICY "exam_select_if_enrolled_or_assigned" ON public.exam
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_course uc
            WHERE uc.course_id = public.exam.course_id
              AND uc.user_id = auth.uid()::uuid
        )
    );

-- Allow INSERT only for instructors linked to the course
CREATE POLICY "exam_insert_if_instructor_of_course" ON public.exam
    FOR INSERT
    WITH CHECK (
                EXISTS (
                        SELECT 1 FROM public.user_course uc
                        JOIN public.profiles u ON u.user_id = uc.user_id
                        WHERE uc.course_id = course_id
                            AND uc.user_id = auth.uid()::uuid
                            AND u.role = 'Instructor'
                )
    );

-- Allow UPDATE only for instructors linked to the course
CREATE POLICY "exam_update_if_instructor_of_course" ON public.exam
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_course uc
            JOIN public.profiles u ON u.user_id = uc.user_id
            WHERE uc.course_id = public.exam.course_id
              AND uc.user_id = auth.uid()::uuid
              AND u.role = 'Instructor'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_course uc
            JOIN public.profiles u ON u.user_id = uc.user_id
            WHERE uc.course_id = course_id
              AND uc.user_id = auth.uid()::uuid
              AND u.role = 'Instructor'
        )
    );

-- Allow DELETE only for instructors linked to the course
CREATE POLICY "exam_delete_if_instructor_of_course" ON public.exam
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_course uc
            JOIN public.profiles u ON u.user_id = uc.user_id
            WHERE uc.course_id = public.exam.course_id
              AND uc.user_id = auth.uid()::uuid
              AND u.role = 'Instructor'
        )
    );

-- 4) RPC wrappers (SECURITY INVOKER so RLS policies apply)
-- Insert a new exam. `created_by` is set from auth.uid().
CREATE OR REPLACE FUNCTION public.rpc_create_exam(
    p_course_id uuid,
    p_exam_title text,
    p_exam_date timestamptz DEFAULT NULL,
    p_passing_rate numeric DEFAULT NULL,
    p_topics text[] DEFAULT NULL
) RETURNS public.exam
LANGUAGE sql SECURITY INVOKER AS $$
    INSERT INTO public.exam (course_id, exam_title, exam_date, passing_rate, topics, created_by)
    VALUES (p_course_id, p_exam_title, p_exam_date, p_passing_rate, p_topics, auth.uid()::uuid)
    RETURNING *;
$$;

-- Read: get exams by course (only returns rows allowed by RLS)
CREATE OR REPLACE FUNCTION public.rpc_get_exams_by_course(p_course_id uuid)
RETURNS SETOF public.exam
LANGUAGE sql SECURITY INVOKER AS $$
    SELECT * FROM public.exam WHERE course_id = p_course_id ORDER BY exam_date NULLS LAST;
$$;

-- Read: get single exam by id
CREATE OR REPLACE FUNCTION public.rpc_get_exam(p_exam_id uuid)
RETURNS public.exam
LANGUAGE sql SECURITY INVOKER AS $$
    SELECT * FROM public.exam WHERE exam_id = p_exam_id LIMIT 1;
$$;

-- Update an exam (fields that are NULL will not be changed)
CREATE OR REPLACE FUNCTION public.rpc_update_exam(
    p_exam_id uuid,
    p_exam_title text DEFAULT NULL,
    p_exam_date timestamptz DEFAULT NULL,
    p_passing_rate numeric DEFAULT NULL,
    p_topics text[] DEFAULT NULL
) RETURNS public.exam
LANGUAGE plpgsql SECURITY INVOKER AS $$
DECLARE
    RESULT public.exam;
BEGIN
    UPDATE public.exam SET
        exam_title = COALESCE(p_exam_title, exam_title),
        exam_date = COALESCE(p_exam_date, exam_date),
        passing_rate = COALESCE(p_passing_rate, passing_rate),
        topics = COALESCE(p_topics, topics)
    WHERE exam_id = p_exam_id
    RETURNING * INTO RESULT;
    RETURN RESULT;
END;
$$;

-- Delete an exam
CREATE OR REPLACE FUNCTION public.rpc_delete_exam(p_exam_id uuid)
RETURNS public.exam
LANGUAGE sql SECURITY INVOKER AS $$
    DELETE FROM public.exam WHERE exam_id = p_exam_id RETURNING *;
$$;

-- 5) Example usage (from client / Supabase JS):
-- Create:
-- const { data, error } = await supabase.rpc('rpc_create_exam', {
--   p_course_id: '...', p_exam_title: 'Midterm', p_exam_date: '2026-01-01T09:00:00Z', p_passing_rate: 0.6, p_topics: ['a','b']
-- });
-- Read:
-- const { data, error } = await supabase.rpc('rpc_get_exams_by_course', { p_course_id: '...' });
-- Update:
-- const { data, error } = await supabase.rpc('rpc_update_exam', { p_exam_id: '...', p_exam_title: 'Updated' });
-- Delete:
-- const { data, error } = await supabase.rpc('rpc_delete_exam', { p_exam_id: '...' });

-- Notes:
-- - These RPCs are SECURITY INVOKER which means RLS will be applied
--   and only rows permitted by the policies will be visible/modifyable.
-- - Ensure the `user_course` table contains instructor assignments and
--   that `public."user".role` uses the string 'instructor'. Adjust if different.