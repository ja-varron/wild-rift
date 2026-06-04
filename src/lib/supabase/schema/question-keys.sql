create table public.question_keys (
  key_id uuid not null default gen_random_uuid (),
  exam_id uuid not null default gen_random_uuid (),
  answer_sets json[] not null,
  constraint question_keys_pkey primary key (key_id),
  constraint question_keys_exam_id_fkey foreign KEY (exam_id) references exams (exam_id) on update CASCADE on delete CASCADE
) TABLESPACE pg_default;