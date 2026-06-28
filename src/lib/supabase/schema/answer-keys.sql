create table public.answer_keys (
  key_id uuid not null default gen_random_uuid (),
  exam_id uuid not null,
  version smallint not null,
  answer_key jsonb not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint answer_keys_pkey primary key (key_id),
  constraint answer_keys_exam_id_fkey foreign KEY (exam_id) references exams (exam_id) on update CASCADE on delete CASCADE
) TABLESPACE pg_default;