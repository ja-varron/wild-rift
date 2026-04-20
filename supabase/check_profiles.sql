-- Check current profiles and their roles
SELECT user_id, email, role FROM public.profiles ORDER BY created_at DESC;

-- If you need to fix roles, use these examples:
-- UPDATE public.profiles SET role = 'Student' WHERE email = 'student@example.com';
-- UPDATE public.profiles SET role = 'Instructor' WHERE email = 'instructor@example.com';
-- UPDATE public.profiles SET role = 'Admin' WHERE email = 'admin@example.com';
