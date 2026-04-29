create table public.question_keys (
  question_id uuid not null default gen_random_uuid (),
  exam_id uuid not null,
  topic_id uuid null,
  question_number integer not null,
  correct_answer text not null,
  created_at timestamp with time zone not null default now(),
  constraint question_keys_pkey primary key (question_id),
  constraint question_keys_exam_id_fkey foreign key (exam_id) references exams (exam_id) on update cascade on delete cascade,
  constraint question_keys_topic_id_fkey foreign key (topic_id) references topics (topic_id) on update cascade on delete set null,
  constraint question_keys_exam_question_number_key unique (exam_id, question_number)
) TABLESPACE pg_default;