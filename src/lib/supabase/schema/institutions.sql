CREATE TABLE IF NOT EXISTS public.institutions {
  institution_id uuid PRIMARY KEY,
  institution_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
}

