create table public.exam_papers (
  paper_id uuid not null default gen_random_uuid (),
  exam_id uuid not null,
  user_id uuid not null,
  actual_answers jsonb null,
  created_at timestamp with time zone not null default now(),
  constraint exam_papers_pkey primary key (paper_id),
  constraint exam_papers_exam_id_fkey foreign key (exam_id) references exams (exam_id) on update cascade on delete cascade,
  constraint exam_papers_user_id_fkey foreign key (user_id) references profiles (user_id) on update cascade on delete cascade
) TABLESPACE pg_default;