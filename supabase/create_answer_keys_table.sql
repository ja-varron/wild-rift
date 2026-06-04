-- Create versioned answer keys table per exam
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

create index if not exists idx_answer_keys_exam_id on public.answer_keys(exam_id);
create unique index if not exists idx_answer_keys_exam_current_unique
  on public.answer_keys(exam_id)
  where is_current;

-- Keep updated_at in sync
create or replace function public.set_answer_keys_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

drop trigger if exists trg_set_answer_keys_updated_at on public.answer_keys;
create trigger trg_set_answer_keys_updated_at
before update on public.answer_keys
for each row
execute function public.set_answer_keys_updated_at();

-- Auto-version rows per exam and ensure only one current version per exam.
create or replace function public.prepare_answer_key_version()
returns trigger
language plpgsql
as $$
begin
  if new.version is null then
    select coalesce(max(ak.version), 0) + 1
    into new.version
    from public.answer_keys ak
    where ak.exam_id = new.exam_id;
  end if;

  if new.is_current then
    update public.answer_keys
    set is_current = false,
        updated_at = timezone('utc'::text, now())
    where exam_id = new.exam_id
      and is_current = true;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_prepare_answer_key_version on public.answer_keys;
create trigger trg_prepare_answer_key_version
before insert on public.answer_keys
for each row
execute function public.prepare_answer_key_version();

-- Instructor-only access through parent exam ownership
alter table public.answer_keys enable row level security;

drop policy if exists "AnswerKeys: instructor select" on public.answer_keys;
drop policy if exists "AnswerKeys: instructor insert" on public.answer_keys;
drop policy if exists "AnswerKeys: instructor update" on public.answer_keys;
drop policy if exists "AnswerKeys: instructor delete" on public.answer_keys;

create policy "AnswerKeys: instructor select" on public.answer_keys
  for select using (
    exists (
      select 1
      from public.exams e
      where e.id = answer_keys.exam_id
        and e.instructor_id = auth.uid()
    )
  );

create policy "AnswerKeys: instructor insert" on public.answer_keys
  for insert with check (
    created_by = auth.uid()
    and exists (
      select 1
      from public.exams e
      where e.id = answer_keys.exam_id
        and e.instructor_id = auth.uid()
    )
  );

create policy "AnswerKeys: instructor update" on public.answer_keys
  for update using (
    exists (
      select 1
      from public.exams e
      where e.id = answer_keys.exam_id
        and e.instructor_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.exams e
      where e.id = answer_keys.exam_id
        and e.instructor_id = auth.uid()
    )
  );

create policy "AnswerKeys: instructor delete" on public.answer_keys
  for delete using (
    exists (
      select 1
      from public.exams e
      where e.id = answer_keys.exam_id
        and e.instructor_id = auth.uid()
    )
  );
