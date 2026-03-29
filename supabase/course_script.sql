-- Create courses table used by frontend hooks.
-- Safe to run multiple times.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.courses (
  course_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_name text NOT NULL,
  course_description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS courses_name_idx ON public.courses (course_name);