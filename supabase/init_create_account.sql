//Examples to add an instructor (pick one):
Create user + promote (recommended — server-side with service role)

import { createClient } from '@supabase/supabase-js'
const admin = createClient(process.env.SUPABASE_URL, process.env.SERVICE_ROLE_KEY)

// 1) create auth user
const { data: user } = await admin.auth.admin.createUser({
  email: 'instructor@example.com',
  password: 'StrongPass123!'
})

// 2) update profile (trigger will create profile if using auth.users trigger)
await admin
  .from('profiles')
  .upsert({ id: user.id, email: 'instructor@example.com', first_name: 'Alice', last_name: 'Teacher', role: 'Instructor' })




//If user already exists, promote by email (run in Supabase SQL editor or with service role)

UPDATE public.profiles
SET role = 'Instructor', updated_at = now()
WHERE email = 'instructor@example.com';


//Backfill role-specific table (if you separated tables)
-- create instructor row for an existing profile id
INSERT INTO public.instructors (id, date_created)
SELECT id, now()
FROM public.profiles
WHERE role = 'Instructor' AND id NOT IN (SELECT id FROM public.instructors);