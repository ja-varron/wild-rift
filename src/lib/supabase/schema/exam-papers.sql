create table public.exam_papers (
  exam_id uuid not null default gen_random_uuid (),
  examination_id_number text not null,
  actual_answer json null,
  constraint exam_papers_exam_id_fkey foreign KEY (exam_id) references exams (exam_id) on update CASCADE on delete CASCADE,
  constraint exam_papers_examination_id_number_fkey foreign KEY (examination_id_number) references user_course (examinee_id_number) on update CASCADE on delete CASCADE
) TABLESPACE pg_default;