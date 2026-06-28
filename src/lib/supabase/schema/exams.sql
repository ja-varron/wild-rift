create table public.exams (
  exam_id uuid not null default gen_random_uuid (),
  course_id uuid not null,
  exam_title text not null,
  exam_date timestamp with time zone null,
  passing_rate numeric null,
  created_by uuid not null,
  created_at timestamp with time zone not null default now(),
  topics character varying[] null,
  total_items numeric not null,
  constraint exam_pkey primary key (exam_id),
  constraint exam_course_id_fkey foreign KEY (course_id) references courses (course_id) on delete CASCADE,
  constraint exam_created_by_fkey foreign KEY (created_by) references profiles (user_id) on delete set null
) TABLESPACE pg_default;