ALTER TABLE public.exams
ADD COLUMN IF NOT EXISTS location VARCHAR(255) DEFAULT 'TBA';

UPDATE public.exams
SET location = 'TBA'
WHERE location IS NULL;
