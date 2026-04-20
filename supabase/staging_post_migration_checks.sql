-- Post-migration verification for:
-- 1) create_exams_table.sql
-- 2) create_prc_licensure_exams_table.sql
-- 3) add_exam_location_column.sql

-- ==========================================================================
-- 1. Required tables
-- ==========================================================================
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('exams', 'exam_results', 'scanned_papers', 'prc_licensure_exams')
order by table_name;

-- ==========================================================================
-- 2. Column and default checks for public.exams
-- ==========================================================================
select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'exams'
  and column_name in ('id', 'instructor_id', 'exam_title', 'course_id', 'location', 'exam_date', 'total_items', 'passing_rate', 'topics', 'answer_keys', 'status')
order by column_name;

-- Location column should exist and be backfilled.
select
  count(*) as total_rows,
  count(*) filter (where location is null) as null_location_rows,
  count(*) filter (where location = 'TBA') as tba_rows
from public.exams;

-- ==========================================================================
-- 3. Index checks
-- ==========================================================================
select schemaname, tablename, indexname
from pg_indexes
where schemaname = 'public'
  and indexname in (
    'idx_exams_instructor_id',
    'idx_exams_course_id',
    'idx_exam_results_exam_id',
    'idx_exam_results_student_id',
    'idx_scanned_papers_exam_id',
    'idx_scanned_papers_student_id'
  )
order by indexname;

-- ==========================================================================
-- 4. RLS enabled checks
-- ==========================================================================
select
  c.relname as table_name,
  c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('exams', 'exam_results', 'scanned_papers', 'prc_licensure_exams')
order by c.relname;

-- ==========================================================================
-- 5. Policy checks (presence)
-- ==========================================================================
select schemaname, tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('exams', 'exam_results', 'scanned_papers', 'prc_licensure_exams')
order by tablename, policyname;

-- Expected policy names:
-- exams: Exams: instructor select|insert|update|delete
-- exam_results: ExamResults: select own_or_instructor|instructor insert|instructor update|instructor delete
-- scanned_papers: ScannedPapers: select own_or_instructor|instructor insert|instructor update|instructor delete
-- prc_licensure_exams: PRC Exams: admin select|insert|update|delete

-- ==========================================================================
-- 6. PRC catalog seed checks
-- ==========================================================================
select
  count(*) as total_prc_rows,
  count(*) filter (where is_active) as active_prc_rows
from public.prc_licensure_exams;

select id, exam_name, is_active, created_at, updated_at
from public.prc_licensure_exams
order by exam_name;

-- ==========================================================================
-- 7. Constraint checks
-- ==========================================================================
select conname, conrelid::regclass as table_name, pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid in (
  'public.exams'::regclass,
  'public.exam_results'::regclass,
  'public.scanned_papers'::regclass,
  'public.prc_licensure_exams'::regclass
)
order by conrelid::regclass::text, conname;

-- ==========================================================================
-- 8. Optional sanity checks for status values
-- ==========================================================================
select status, count(*)
from public.exams
group by status
order by status;
