-- Account setup helper script (SQL-only)
-- Assumes `init_accounts.sql` has already been executed.

-- 1) Promote an existing user to Instructor by email.
-- Replace the email before running.
UPDATE public.profiles
SET role = 'Instructor', updated_at = now(), is_active = true
WHERE email = 'instructor@example.com';

-- 2) Optional: if you use `separate_roles.sql`, backfill the instructors table.
-- Safe to run multiple times.
INSERT INTO public.instructors (user_id, created_at)
SELECT p.user_id, now()
FROM public.profiles p
LEFT JOIN public.instructors i ON i.user_id = p.user_id
WHERE p.role = 'Instructor' AND i.user_id IS NULL;

-- 3) Optional: promote an existing user to Student and backfill students table.
-- UPDATE public.profiles
-- SET role = 'Student', updated_at = now(), is_active = true
-- WHERE email = 'student@example.com';

-- INSERT INTO public.students (user_id, created_at)
-- SELECT p.user_id, now()
-- FROM public.profiles p
-- LEFT JOIN public.students s ON s.user_id = p.user_id
-- WHERE p.role = 'Student' AND s.user_id IS NULL;