create table public.user_course (
  user_id uuid not null default gen_random_uuid (),
  course_id uuid null default gen_random_uuid (),
  examinee_id_number text null,
  constraint user_course_examinee_id_number_key unique (examinee_id_number),
  constraint user_course_course_id_fkey foreign KEY (course_id) references courses (course_id) on update CASCADE on delete CASCADE,
  constraint user_course_user_id_fkey foreign KEY (user_id) references profiles (user_id) on update CASCADE on delete CASCADE,
  constraint user_course_examinee_id_number_check check ((length(examinee_id_number) <= 10))
) TABLESPACE pg_default;