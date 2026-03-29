-- Fix: Remove infinite recursion in profiles RLS policies
-- The admin policies were querying the profiles table within its own policy,
-- causing infinite recursion (PostgreSQL error 42P17)

-- Drop the recursive admin policies
DROP POLICY IF EXISTS "Profiles: admin select" ON public.profiles;
DROP POLICY IF EXISTS "Profiles: admin update" ON public.profiles;
DROP POLICY IF EXISTS "Profiles: admin delete" ON public.profiles;

-- Keep only the self-select policy (non-recursive)
-- Users can only see their own profile
-- Admin checks will be done at the application level (backend/frontend)
-- No policy needed for admins - all authenticated users can select their own record

-- Verify the remaining policies are for self-access only
-- SELECT auth.uid(), * FROM public.profiles LIMIT 1;
-- This should return only the current user's own profile row
