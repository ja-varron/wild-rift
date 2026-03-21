CREATE TABLE IF NOT EXISTS public.user_course (
  user_id uuid REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  course_id uuid REFERENCES public.courses(course_id) ON DELETE CASCADE,
  examinee_id_number text UNIQUE
);