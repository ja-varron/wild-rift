-- Create exams table
CREATE TABLE IF NOT EXISTS public.exams (
  id BIGSERIAL PRIMARY KEY,
  instructor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_title VARCHAR(255) NOT NULL,
  course_id VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  exam_date TIMESTAMP WITH TIME ZONE,
  total_items INTEGER DEFAULT 100,
  passing_rate INTEGER DEFAULT 75,
  topics JSONB,
  answer_keys JSONB,
  status VARCHAR(50) DEFAULT 'Draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create exam_results table
CREATE TABLE IF NOT EXISTS public.exam_results (
  id BIGSERIAL PRIMARY KEY,
  exam_id BIGINT NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_name VARCHAR(255),
  score NUMERIC(10, 2),
  total_items INTEGER,
  passed BOOLEAN DEFAULT FALSE,
  topic_scores JSONB,
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (exam_id, student_id)
);

-- Create scanned_papers table
CREATE TABLE IF NOT EXISTS public.scanned_papers (
  id BIGSERIAL PRIMARY KEY,
  exam_id BIGINT NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  student_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  student_name VARCHAR(255),
  status VARCHAR(50) DEFAULT 'Pending',
  scanned_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_exams_instructor_id ON public.exams(instructor_id);
CREATE INDEX IF NOT EXISTS idx_exams_course_id ON public.exams(course_id);
CREATE INDEX IF NOT EXISTS idx_exam_results_exam_id ON public.exam_results(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_results_student_id ON public.exam_results(student_id);
CREATE INDEX IF NOT EXISTS idx_scanned_papers_exam_id ON public.scanned_papers(exam_id);
CREATE INDEX IF NOT EXISTS idx_scanned_papers_student_id ON public.scanned_papers(student_id);

-- Enable RLS
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scanned_papers ENABLE ROW LEVEL SECURITY;

-- Make policy creation idempotent for repeatable deployments.
DROP POLICY IF EXISTS "Exams: instructor select" ON public.exams;
DROP POLICY IF EXISTS "Exams: instructor insert" ON public.exams;
DROP POLICY IF EXISTS "Exams: instructor update" ON public.exams;
DROP POLICY IF EXISTS "Exams: instructor delete" ON public.exams;

DROP POLICY IF EXISTS "ExamResults: select own_or_instructor" ON public.exam_results;
DROP POLICY IF EXISTS "ExamResults: instructor insert" ON public.exam_results;
DROP POLICY IF EXISTS "ExamResults: instructor update" ON public.exam_results;
DROP POLICY IF EXISTS "ExamResults: instructor delete" ON public.exam_results;

DROP POLICY IF EXISTS "ScannedPapers: select own_or_instructor" ON public.scanned_papers;
DROP POLICY IF EXISTS "ScannedPapers: instructor insert" ON public.scanned_papers;
DROP POLICY IF EXISTS "ScannedPapers: instructor update" ON public.scanned_papers;
DROP POLICY IF EXISTS "ScannedPapers: instructor delete" ON public.scanned_papers;

-- Drop legacy permissive policies if they exist.
DROP POLICY IF EXISTS "Enable read for instructors" ON public.exams;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.exams;
DROP POLICY IF EXISTS "Enable update for instructors" ON public.exams;
DROP POLICY IF EXISTS "Enable delete for instructors" ON public.exams;

DROP POLICY IF EXISTS "Enable insert for all" ON public.exam_results;
DROP POLICY IF EXISTS "Enable read for all" ON public.exam_results;

DROP POLICY IF EXISTS "Enable insert for all" ON public.scanned_papers;
DROP POLICY IF EXISTS "Enable read for all" ON public.scanned_papers;

-- RLS Policies for exams table
CREATE POLICY "Exams: instructor select" ON public.exams
  FOR SELECT USING (auth.uid() = instructor_id);

CREATE POLICY "Exams: instructor insert" ON public.exams
  FOR INSERT WITH CHECK (auth.uid() = instructor_id);

CREATE POLICY "Exams: instructor update" ON public.exams
  FOR UPDATE USING (auth.uid() = instructor_id);

CREATE POLICY "Exams: instructor delete" ON public.exams
  FOR DELETE USING (auth.uid() = instructor_id);

-- RLS Policies for exam_results table
CREATE POLICY "ExamResults: select own_or_instructor" ON public.exam_results
  FOR SELECT USING (
    student_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.exams e
      WHERE e.id = exam_results.exam_id
        AND e.instructor_id = auth.uid()
    )
  );

CREATE POLICY "ExamResults: instructor insert" ON public.exam_results
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.exams e
      WHERE e.id = exam_results.exam_id
        AND e.instructor_id = auth.uid()
    )
  );

CREATE POLICY "ExamResults: instructor update" ON public.exam_results
  FOR UPDATE USING (
    EXISTS (
      SELECT 1
      FROM public.exams e
      WHERE e.id = exam_results.exam_id
        AND e.instructor_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.exams e
      WHERE e.id = exam_results.exam_id
        AND e.instructor_id = auth.uid()
    )
  );

CREATE POLICY "ExamResults: instructor delete" ON public.exam_results
  FOR DELETE USING (
    EXISTS (
      SELECT 1
      FROM public.exams e
      WHERE e.id = exam_results.exam_id
        AND e.instructor_id = auth.uid()
    )
  );

-- RLS Policies for scanned_papers table
CREATE POLICY "ScannedPapers: select own_or_instructor" ON public.scanned_papers
  FOR SELECT USING (
    student_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.exams e
      WHERE e.id = scanned_papers.exam_id
        AND e.instructor_id = auth.uid()
    )
  );

CREATE POLICY "ScannedPapers: instructor insert" ON public.scanned_papers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.exams e
      WHERE e.id = scanned_papers.exam_id
        AND e.instructor_id = auth.uid()
    )
  );

CREATE POLICY "ScannedPapers: instructor update" ON public.scanned_papers
  FOR UPDATE USING (
    EXISTS (
      SELECT 1
      FROM public.exams e
      WHERE e.id = scanned_papers.exam_id
        AND e.instructor_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.exams e
      WHERE e.id = scanned_papers.exam_id
        AND e.instructor_id = auth.uid()
    )
  );

CREATE POLICY "ScannedPapers: instructor delete" ON public.scanned_papers
  FOR DELETE USING (
    EXISTS (
      SELECT 1
      FROM public.exams e
      WHERE e.id = scanned_papers.exam_id
        AND e.instructor_id = auth.uid()
    )
  );
