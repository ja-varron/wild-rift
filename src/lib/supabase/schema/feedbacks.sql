create table public.feedbacks (
  feedback_id uuid not null default gen_random_uuid (),
  exam_id uuid not null default gen_random_uuid (),
  examination_id_number text not null,
  comment text not null,
  created_at timestamp with time zone not null default now(),
  constraint feedbacks_pkey primary key (feedback_id),
  constraint feedbacks_exam_id_fkey foreign KEY (exam_id) references exams (exam_id) on update CASCADE on delete CASCADE,
  constraint feedbacks_examination_id_number_fkey foreign KEY (examination_id_number) references user_course (examinee_id_number) on update CASCADE on delete CASCADE
) TABLESPACE pg_default;