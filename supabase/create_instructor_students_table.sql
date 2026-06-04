-- Create instructor_students table to link students to instructors
-- This establishes the relationship: which students belong to which instructor

CREATE TABLE IF NOT EXISTS public.instructor_students (
  id BIGSERIAL PRIMARY KEY,
  instructor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(instructor_id, student_id)
);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_instructor_students_instructor_id ON public.instructor_students(instructor_id);
CREATE INDEX IF NOT EXISTS idx_instructor_students_student_id ON public.instructor_students(student_id);

-- Enable RLS
ALTER TABLE public.instructor_students ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (PostgreSQL doesn't support IF NOT EXISTS for policies)
DROP POLICY IF EXISTS "Instructors can view their students" ON public.instructor_students;
DROP POLICY IF EXISTS "Instructors can add students" ON public.instructor_students;
DROP POLICY IF EXISTS "Instructors can remove students" ON public.instructor_students;
DROP POLICY IF EXISTS "Students can view their instructors" ON public.instructor_students;

-- RLS Policies
-- Instructors can view and manage their own students
CREATE POLICY "Instructors can view their students" ON public.instructor_students
  FOR SELECT USING (auth.uid() = instructor_id OR auth.uid() = student_id);

CREATE POLICY "Instructors can add students" ON public.instructor_students
  FOR INSERT WITH CHECK (auth.uid() = instructor_id);

CREATE POLICY "Instructors can remove students" ON public.instructor_students
  FOR DELETE USING (auth.uid() = instructor_id);

-- Students can view their instructors
CREATE POLICY "Students can view their instructors" ON public.instructor_students
  FOR SELECT USING (auth.uid() = student_id);
