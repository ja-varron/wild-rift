-- Supabase SQL: Profiles & Account setup for wild-rift
-- Creates a `user_role` enum, `profiles` table, triggers to sync with
-- `auth.users`, and row-level security (RLS) policies.

-- 1) Enum for roles
DO $$ BEGIN
    CREATE TYPE public.user_role AS ENUM ('Instructor','Student','Admin');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 2) Profiles table (one row per auth.user)
create table public.profiles (
  user_id uuid not null,
  email character varying not null,
  first_name character varying not null,
  middle_name character varying null,
  last_name character varying not null,
  role public.user_role not null default 'Student'::user_role,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  institution_id uuid not null,
  examinee_id_number character varying not null default 'N/A'::character varying,
  constraint profiles_pkey primary key (user_id),
  constraint profiles_email_key unique (email),
  constraint profiles_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE,
  constraint profiles_institution_id_fkey foreign KEY (institution_id) references institutions (institution_id) on update RESTRICT on delete RESTRICT,
  constraint profiles_email_check check ((length((email)::text) <= 50)),
  constraint profiles_last_name_check check ((length((last_name)::text) <= 30)),
  constraint profiles_middle_name_check check ((length((middle_name)::text) <= 20)),
  constraint profiles_examinee_id_number_check check ((length((examinee_id_number)::text) <= 15)),
  constraint profiles_first_name_check check ((length((first_name)::text) <= 50))
) TABLESPACE pg_default;

create index IF not exists profiles_role_idx on public.profiles using btree (role) TABLESPACE pg_default;

create trigger set_updated_at_trigger BEFORE
update on profiles for EACH row
execute FUNCTION set_updated_at ();

CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles (role);