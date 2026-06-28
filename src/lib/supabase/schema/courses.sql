create table public.courses (
  course_id uuid not null default gen_random_uuid (),
  institution_id uuid not null,
  course_name text not null,
  course_description text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint course_pkey primary key (course_id),
  constraint course_institution_id_fkey foreign KEY (institution_id) references institutions (institution_id) on update CASCADE on delete CASCADE
) TABLESPACE pg_default;

create trigger set_courses_updated_at_trigger BEFORE
update on courses for EACH row
execute FUNCTION set_updated_at ();