create table public.score_results (
  exam_id uuid not null,
  student_id uuid not null,
  scores jsonb not null,
  constraint score_results_exam_id_fkey foreign KEY (exam_id) references exams (exam_id) on update CASCADE on delete CASCADE,
  constraint score_results_student_id_fkey foreign KEY (student_id) references profiles (user_id) on update CASCADE on delete CASCADE
) TABLESPACE pg_default;