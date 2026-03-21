CREATE TABLE IF NOT EXISTS public.courses (
  course_id uuid PRIMARY KEY,
  course_name text NOT NULL,
  course_description text,
  created_at timestampz NOT NULL DEFAULT now()
);