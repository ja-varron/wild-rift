# Staging Migration Checklist (Exams + PRC Licensure + Location)

This checklist covers:
- `supabase/create_exams_table.sql`
- `supabase/create_prc_licensure_exams_table.sql`
- `supabase/add_exam_location_column.sql`

## Scope
- Create/secure exams tables and policies
- Create/secure PRC licensure exam catalog and seed defaults
- Add/backfill `public.exams.location`

## Pre-Migration
1. Confirm target environment is staging.
2. Confirm no production traffic is routed to staging.
3. Capture a quick metadata snapshot:

```sql
select now() as snapshot_time;

select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('exams', 'exam_results', 'scanned_papers', 'prc_licensure_exams')
order by table_name;

select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'exams'
order by ordinal_position;
```

4. Save current policy state for comparison:

```sql
select schemaname, tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('exams', 'exam_results', 'scanned_papers', 'prc_licensure_exams')
order by tablename, policyname;
```

## Migration Order
Run in this order:

1. `supabase/create_exams_table.sql`
2. `supabase/create_prc_licensure_exams_table.sql`
3. `supabase/add_exam_location_column.sql`

Notes:
- Scripts are written to be idempotent (`IF NOT EXISTS` and policy drops before creates).
- Run each script fully; do not cherry-pick statements.

## Post-Migration Verification
Run `supabase/staging_post_migration_checks.sql` immediately after all three scripts.

Pass criteria:
1. All expected tables exist.
2. `public.exams.location` exists and has no NULL values.
3. RLS is enabled on `public.exams`, `public.exam_results`, `public.scanned_papers`, and `public.prc_licensure_exams`.
4. Required policies are present.
5. PRC seed data exists (at least 6 baseline rows).

## Operational Smoke Queries
Optional quick checks:

```sql
-- Verify location default behavior
insert into public.exams (instructor_id, exam_title, course_id)
select id, 'Staging Migration Smoke Exam', 'SMOKE-101'
from auth.users
limit 1
returning id, location;

-- Cleanup smoke data (if inserted)
delete from public.exams where exam_title = 'Staging Migration Smoke Exam';
```

## Rollback Strategy
Use only if staging validation fails and you need immediate revert.

1. Revert application deployment to previous build.
2. If schema rollback is required, run explicit downgrade SQL (prepare separately).
3. Re-run verification queries to confirm rollback state.

Because these scripts create tables/policies and add a column, rollback should be explicit and reviewed before execution.

## Sign-Off Template
- Environment: staging
- Date/Time:
- Operator:
- Scripts executed in order: yes/no
- Verification file run: yes/no
- All checks passed: yes/no
- Notes:
