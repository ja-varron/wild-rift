create table public.courses (
  course_id uuid not null default gen_random_uuid (),
  course_name text not null,
  course_description text null,
  created_at timestamp with time zone not null default now(),
  constraint course_pkey primary key (course_id)
) TABLESPACE pg_default;