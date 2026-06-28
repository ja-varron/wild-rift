create table public.institutions (
  institution_id uuid not null default gen_random_uuid (),
  institution_name text not null,
  created_at timestamp with time zone not null default now(),
  constraint institutions_pkey primary key (institution_id)
) TABLESPACE pg_default;