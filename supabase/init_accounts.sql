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
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  first_name text NOT NULL,
  middle_name text,
  last_name text NOT NULL,
  role public.user_role NOT NULL DEFAULT 'Student',
  prc_exam_type text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles (role);

-- 3) Trigger helper to keep `updated_at` fresh
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_trigger ON public.profiles;
CREATE TRIGGER set_updated_at_trigger
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4) Sync auth.users -> public.profiles on signup
-- When a new auth user is created, insert a matching profile row.
CREATE OR REPLACE FUNCTION public.handle_auth_user_created()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, first_name, middle_name, last_name, role, created_at)
  VALUES (NEW.id, NEW.email, '', NULL, '', 'Student', now())
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS auth_user_created ON auth.users;
CREATE TRIGGER auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_auth_user_created();

-- 5) Remove profile when auth.user is removed
CREATE OR REPLACE FUNCTION public.handle_auth_user_deleted()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.profiles WHERE user_id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS auth_user_deleted ON auth.users;
CREATE TRIGGER auth_user_deleted
AFTER DELETE ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_auth_user_deleted();

-- 6) Row Level Security: enable and policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to select their own profile
CREATE POLICY "Profiles: allow select own" ON public.profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to update their own profile
CREATE POLICY "Profiles: allow update own" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own profile (optional)
CREATE POLICY "Profiles: allow delete own" ON public.profiles
  FOR DELETE
  USING (auth.uid() = user_id);

-- Admin policies: allow users with `role = 'Admin'` in their profile to manage all
CREATE POLICY "Profiles: admin select" ON public.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles ap WHERE ap.user_id = auth.uid() AND ap.role = 'Admin'
    )
  );

CREATE POLICY "Profiles: admin update" ON public.profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles ap WHERE ap.user_id = auth.uid() AND ap.role = 'Admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles ap WHERE ap.user_id = auth.uid() AND ap.role = 'Admin'
    )
  );

CREATE POLICY "Profiles: admin delete" ON public.profiles
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles ap WHERE ap.user_id = auth.uid() AND ap.role = 'Admin'
    )
  );

-- 7) Example usage (for local testing only):
-- Note: `id` must be a valid auth.users id in Supabase. Use Supabase Auth to create a user
-- then the trigger will create a profile automatically. For manual insertion (tests):
-- INSERT INTO auth.users (id, email) VALUES ('00000000-0000-0000-0000-000000000000', 'test@example.com');
-- INSERT INTO public.profiles (user_id, email, first_name, last_name, role)
-- VALUES ('00000000-0000-0000-0000-000000000000','test@example.com','Test', 'User','Student');

-- End of migration
