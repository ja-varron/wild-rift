create table public.exam_papers (
  paper_id uuid not null default gen_random_uuid (),
  exam_id uuid not null,
  student_id uuid not null,
  actual_answers jsonb null,
  created_at timestamp with time zone not null default now(),
  constraint exam_papers_pkey primary key (paper_id),
  constraint exam_papers_exam_id_fkey foreign KEY (exam_id) references exams (exam_id) on update CASCADE on delete CASCADE,
  constraint exam_papers_student_id_fkey foreign KEY (student_id) references profiles (user_id) on update CASCADE on delete CASCADE
) TABLESPACE pg_default;