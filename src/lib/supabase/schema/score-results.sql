create table public.score_results (
  exam_id uuid not null default gen_random_uuid (),
  examinee_id_number text not null default gen_random_uuid (),
  total_score bigint not null,
  created_at timestamp without time zone not null default now(),
  constraint score_results_exam_id_fkey foreign KEY (exam_id) references exams (exam_id) on update CASCADE on delete CASCADE,
  constraint score_results_examinee_id_number_fkey foreign KEY (examinee_id_number) references user_course (examinee_id_number) on update CASCADE on delete CASCADE
) TABLESPACE pg_default;