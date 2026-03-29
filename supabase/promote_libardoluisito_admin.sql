-- Promote user to Admin by email (Supabase SQL)
-- USAGE: Run this in your Supabase project's SQL editor (requires an admin/service role)
-- Replace first_name / last_name values below if you want different display names.

BEGIN;

-- 1) Ensure a profile row exists for the auth user with this email.
INSERT INTO public.profiles (user_id, email, first_name, middle_name, last_name, role, created_at, is_active)
SELECT id, email, 'Libardo', NULL, 'Luisito', 'Admin', now(), true
FROM auth.users
WHERE email = 'libardoluisito123@gmail.com'
ON CONFLICT (user_id) DO UPDATE
  SET email = EXCLUDED.email,
      first_name = COALESCE(EXCLUDED.first_name, public.profiles.first_name),
      middle_name = COALESCE(EXCLUDED.middle_name, public.profiles.middle_name),
      last_name = COALESCE(EXCLUDED.last_name, public.profiles.last_name),
      role = 'Admin',
      is_active = true,
      updated_at = now();

-- 2) If a profile already exists, ensure its role is Admin and timestamp is updated.
UPDATE public.profiles
SET role = 'Admin', updated_at = now(), is_active = true
WHERE email = 'libardoluisito123@gmail.com';

-- 3) Optionally remove any student/instructor rows (Admins should not be in role-specific tables)
DELETE FROM public.instructors
WHERE user_id IN (SELECT user_id FROM public.profiles WHERE email = 'libardoluisito123@gmail.com');

DELETE FROM public.students
WHERE user_id IN (SELECT user_id FROM public.profiles WHERE email = 'libardoluisito123@gmail.com');

COMMIT;

-- NOTES:
-- - This migration assumes your project uses the `public.profiles` table and `auth.users` as created by `init_accounts.sql`.
-- - Running this requires a SQL role with rights to read `auth.users` and write `public.profiles` (Supabase SQL editor with project owner/service role is fine).
-- - If you want to also update auth metadata (app_metadata/user_metadata) or set a password, use the Supabase Admin client (service role) or Supabase Dashboard -> Authentication UI.
