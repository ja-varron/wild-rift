create table public.feedbacks (
  feedback_id uuid not null default gen_random_uuid (),
  exam_id uuid not null,
  user_id uuid not null,
  comment text not null,
  created_at timestamp with time zone not null default now(),
  constraint feedbacks_pkey primary key (feedback_id),
  constraint feedbacks_exam_id_fkey foreign KEY (exam_id) references exams (exam_id) on update CASCADE on delete CASCADE,
  constraint feedbacks_user_id_fkey foreign KEY (user_id) references profiles (user_id) on update CASCADE on delete CASCADE
) TABLESPACE pg_default;