create table public.course_enrollment (
  user_id uuid not null,
  course_id uuid not null,
  created_at timestamp with time zone not null default now(),
  constraint course_enrollment_pkey primary key (user_id, course_id),
  constraint course_enrollment_course_id_fkey foreign KEY (course_id) references courses (course_id) on update CASCADE on delete CASCADE,
  constraint course_enrollment_user_id_fkey foreign KEY (user_id) references profiles (user_id) on update CASCADE on delete CASCADE
) TABLESPACE pg_default;