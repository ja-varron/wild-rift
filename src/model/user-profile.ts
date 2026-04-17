export interface UserProfile {
  user_id?: string
  first_name: string
  middle_name?: string | null
  last_name: string
  email: string
  role: "Instructor" | "Student" | "Admin"
  created_at?: string
  updated_at?: string
  institution_id: string
  examinee_id_number?: string | null
}