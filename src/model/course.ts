export interface Topic {
  topic_id: number
  topic_name: string
  subject_id: number
}

export interface Subject {
  subject_id: number
  subject_name: string
  course_id: number
  topics: Topic[]
}

export interface Course {
  course_id: number
  course_name: string
  course_code: string
  description: string
  subjects: Subject[]
  enrolled_students?: number
  enrolled_instructors?: number
}
