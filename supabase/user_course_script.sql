-- User-to-course mapping table.
-- Uses `profiles.user_id` from init_accounts.sql.

CREATE TABLE IF NOT EXISTS public.user_course (
  user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(course_id) ON DELETE CASCADE,
  examinee_id_number text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, course_id)
);

CREATE INDEX IF NOT EXISTS user_course_course_id_idx ON public.user_course (course_id);