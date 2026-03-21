-- Supabase SQL migration: separate `students` and `instructors` tables
-- Creates role-specific tables, sync trigger when `profiles.role` changes,
-- backfill helpers, and RLS policies.

-- 1) Create instructors table
CREATE TABLE IF NOT EXISTS public.instructors (
  id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  bio text DEFAULT '',
  department text DEFAULT '',
  extra jsonb DEFAULT '{}'::jsonb,
  date_created timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS instructors_date_idx ON public.instructors (date_created);

-- 2) Create students table
CREATE TABLE IF NOT EXISTS public.students (
  id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_number text DEFAULT '',
  year_level int DEFAULT 1,
  extra jsonb DEFAULT '{}'::jsonb,
  date_created timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS students_date_idx ON public.students (date_created);

-- 3) Function to sync role-specific rows when profile.role changes
CREATE OR REPLACE FUNCTION public.sync_role_tables()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = OLD.role THEN
    RETURN NEW;
  END IF;

  -- If switched to Instructor, ensure instructor row exists and remove student row
  IF NEW.role = 'Instructor' THEN
    INSERT INTO public.instructors (id, date_created)
      VALUES (NEW.id, now())
      ON CONFLICT (id) DO NOTHING;
    DELETE FROM public.students WHERE id = NEW.id;
  ELSIF NEW.role = 'Student' THEN
    INSERT INTO public.students (id, date_created)
      VALUES (NEW.id, now())
      ON CONFLICT (id) DO NOTHING;
    DELETE FROM public.instructors WHERE id = NEW.id;
  ELSE
    -- for other roles (Admin) remove role-specific rows
    DELETE FROM public.students WHERE id = NEW.id;
    DELETE FROM public.instructors WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS profiles_role_change ON public.profiles;
CREATE TRIGGER profiles_role_change
AFTER UPDATE OF role ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.sync_role_tables();

-- 4) Backfill helpers: populate tables for existing profiles
-- Run these manually in SQL Editor if you already have users.
-- Insert instructors
-- INSERT INTO public.instructors (id, date_created)
-- SELECT id, now() FROM public.profiles WHERE role = 'Instructor' AND id NOT IN (SELECT id FROM public.instructors);
-- Insert students
-- INSERT INTO public.students (id, date_created)
-- SELECT id, now() FROM public.profiles WHERE role = 'Student' AND id NOT IN (SELECT id FROM public.students);

-- 5) Enable RLS and policies for instructors
ALTER TABLE public.instructors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors: select own" ON public.instructors
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Instructors: update own" ON public.instructors
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Instructors: admin select" ON public.instructors
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles ap WHERE ap.id = auth.uid() AND ap.role = 'Admin')
  );

CREATE POLICY "Instructors: admin update" ON public.instructors
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles ap WHERE ap.id = auth.uid() AND ap.role = 'Admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles ap WHERE ap.id = auth.uid() AND ap.role = 'Admin')
  );

-- 6) Enable RLS and policies for students
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students: select own" ON public.students
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Students: update own" ON public.students
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Students: admin select" ON public.students
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles ap WHERE ap.id = auth.uid() AND ap.role = 'Admin')
  );

CREATE POLICY "Students: admin update" ON public.students
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles ap WHERE ap.id = auth.uid() AND ap.role = 'Admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles ap WHERE ap.id = auth.uid() AND ap.role = 'Admin')
  );

-- 7) Notes:
-- - After running this migration, role changes on `public.profiles` will create/delete
--   rows in `public.instructors` and `public.students` automatically.
-- - Use the backfill INSERT statements above to populate role-specific tables for existing users.
-- - Only admins (as defined by `profiles.role = 'Admin'`) or service-role keys can change `role`.
