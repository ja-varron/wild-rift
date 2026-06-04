import type { UserProfile } from "@/model/user-profile";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/supabase";
import { useEffect } from "react";
import type { Student } from "@/pages/instructor/students/types";

type ScoreTopicPayload = {
  topicId?: number
  topicName?: string
  score?: number
  maxScore?: number
  total?: number
  topic?: {
    topic_idx?: number
    name?: string
  }
}

type ScorePayload = {
  totalScore?: number
  totalItems?: number
  passed?: boolean
  topicScores?: ScoreTopicPayload[]
}

type ScoreResultRow = {
  score_result_id?: string | null
  student_id?: string | null
  scores?: unknown
  scanned_at?: string | null
  exams?: {
    exam_id?: string | null
    exam_title?: string | null
    exam_date?: string | null
    course_id?: string | null
    courses?: {
      course_name?: string | null
    } | null
  } | null
}

type FeedbackRow = {
  exam_id?: string | null
  student_id?: string | null
  comment?: string | null
  message_at?: string | null
}

function parseScorePayload(value: unknown): ScorePayload {
  if (!value) return {}
  if (Array.isArray(value)) return { topicScores: value as ScoreTopicPayload[] }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown
      if (Array.isArray(parsed)) return { topicScores: parsed as ScoreTopicPayload[] }
      return (parsed ?? {}) as ScorePayload
    } catch {
      return {}
    }
  }
  return value as ScorePayload
}

function normalizeTopicScores(raw: ScoreTopicPayload[] | undefined) {
  if (!Array.isArray(raw)) return []

  return raw.map((entry, index) => {
    const topicId =
      (typeof entry.topic?.topic_idx === "number" && Number.isFinite(entry.topic.topic_idx)
        ? entry.topic.topic_idx
        : undefined) ??
      (typeof entry.topicId === "number" && Number.isFinite(entry.topicId)
        ? entry.topicId
        : index + 1)

    const topicName =
      (typeof entry.topic?.name === "string" && entry.topic.name.trim()) ||
      (typeof entry.topicName === "string" && entry.topicName.trim()) ||
      `Topic ${index + 1}`

    const score = Number.isFinite(Number(entry.score)) ? Number(entry.score) : 0
    const maxScore = Number.isFinite(Number(entry.maxScore))
      ? Number(entry.maxScore)
      : Number.isFinite(Number(entry.total))
        ? Number(entry.total)
        : 0

    return {
      topicId,
      topicName,
      score,
      maxScore,
    }
  })
}

// Helper function to fetch all students in a course
const fetchStudentsByCourse = async(course_id: string): Promise<Student[]> => {
  if (!course_id) {
    throw new Error("Course ID is required to fetch students")
  }

  const { data, error } = await supabase
    .from('profiles')
    .select(`
      user_id, first_name, last_name, email, examinee_id_number,
      course_enrollment!inner (
        course_id
      )
    `)
    .eq('role', 'Student')
    .eq('course_enrollment.course_id', course_id)

  if (error) {
    console.error("Error fetching students by course:", error);
    throw new Error(error.message);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const students: Student[] = (data || []).map((student: any) => {
    return {
      user_id: student.user_id,
      name: `${student.first_name} ${student.last_name}`,
      email: student.email,
      examinee_id_number: student.examinee_id_number,
      examResults: []
    }
  })

  if (students.length === 0) {
    return students
  }

  const studentIds = students.map((student) => student.user_id).filter(Boolean)
  const { data: scoreRows, error: scoresError } = await supabase
    .from("score_results")
    .select(
      `score_result_id, student_id, scores, scanned_at,
       exams!inner (
         exam_id, exam_title, exam_date, course_id,
         courses (course_name)
       )`
    )
    .in("student_id", studentIds)
    .eq("exams.course_id", course_id)
    .order("scanned_at", { ascending: false })

  if (scoresError) {
    console.error("Error fetching score results:", scoresError)
    return students
  }

  const examIds = Array.from(
    new Set(
      (scoreRows || [])
        .map((row) => {
          const exam = Array.isArray(row.exams) ? row.exams[0] : row.exams
          return exam?.exam_id ?? null
        })
        .filter((examId): examId is string => Boolean(examId))
    ),
  )

  const feedbackByKey = new Map<string, string>()
  if (examIds.length > 0) {
    const { data: feedbackRows, error: feedbackError } = await supabase
      .from("feedbacks")
      .select("exam_id, student_id, comment, message_at")
      .in("exam_id", examIds)
      .in("student_id", studentIds)
      .order("message_at", { ascending: false })

    if (feedbackError) {
      console.error("Error fetching feedback:", feedbackError)
    } else {
      for (const row of (feedbackRows || []) as FeedbackRow[]) {
        const examId = row.exam_id ?? ""
        const studentId = row.student_id ?? ""
        if (!examId || !studentId) continue
        const key = `${examId}-${studentId}`
        if (!feedbackByKey.has(key) && row.comment?.trim()) {
          feedbackByKey.set(key, row.comment.trim())
        }
      }
    }
  }

  const examResultsByStudent = new Map<string, Student["examResults"]>()
  for (const row of (scoreRows || []) as ScoreResultRow[]) {
    const studentId = row.student_id ?? ""
    if (!studentId) continue

    const payload = parseScorePayload(row.scores)
    const totalItems = Number(payload.totalItems)
    const totalScore = Number(payload.totalScore)
    const hasCheckedResult = Number.isFinite(totalItems) && totalItems > 0 && Number.isFinite(totalScore)
    if (!hasCheckedResult) continue

    const exam = Array.isArray(row.exams) ? row.exams[0] : row.exams
    const examId = exam?.exam_id ?? ""
    const examTitle =
      (typeof exam?.exam_title === "string" && exam.exam_title.trim())
        ? exam.exam_title
        : exam?.exam_id
          ? `Exam ${exam.exam_id}`
          : "Exam"
    const rawDate = exam?.exam_date || row.scanned_at
    const date = rawDate
      ? new Date(rawDate).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "—"
    const course = exam?.courses?.course_name || "Course"
    const passed = typeof payload.passed === "boolean"
      ? payload.passed
      : Math.round((totalScore / totalItems) * 100) >= 75

    const topicScores = normalizeTopicScores(payload.topicScores)

    const feedback = examId
      ? feedbackByKey.get(`${examId}-${studentId}`)
      : undefined

    const result = {
      id: row.score_result_id || `${exam?.exam_id ?? "exam"}-${studentId}`,
      examTitle,
      course,
      date,
      score: totalScore,
      totalItems,
      passed,
      topicScores,
      feedback,
    }

    const current = examResultsByStudent.get(studentId) ?? []
    current.push(result)
    examResultsByStudent.set(studentId, current)
  }

  return students.map((student) => ({
    ...student,
    examResults: examResultsByStudent.get(student.user_id) ?? [],
  }))
    
}


// Helper function to fetch all users in an institution
const fetchUsers = async (institution_id: string) : Promise<UserProfile[]> => {
  if (!institution_id) {
    throw new Error("Institution ID is required to fetch users")
  }

  // Fetch all users in an institution
  const { data, error } = await supabase
    .from('profiles')
    .select(
      `user_id, first_name, middle_name, last_name, email, role, examinee_id_number, institution_id,
       course_enrollment(
         courses(course_id, course_name)
       )`
    )
    .eq('institution_id', institution_id)
    .in('role', ['Student', 'Instructor'])
    .order('created_at', { ascending: true })
    
  if (error) {
    console.error("Error fetching users:", error);
    throw new Error(error.message);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userProfiles: UserProfile[] = (data || []).map((user: any) => {
    // Unpack course from the nested array structure Supabase returns for many-to-many joins
    const firstCourseItem = Array.isArray(user.course_enrollment) && user.course_enrollment.length > 0 
      ? user.course_enrollment[0] 
      : user.course_enrollment;
    
    // Safely extract the `courses` object
    const courseObj = firstCourseItem?.courses ? {
      course_id: firstCourseItem.courses.course_id,
      course_name: firstCourseItem.courses.course_name
    } : null;

    return {
      user_id: user.user_id,
      first_name: user.first_name,
      middle_name: user.middle_name,
      last_name: user.last_name,
      email: user.email,
      role: user.role,
      institution_id: user.institution_id,
      examinee_id_number: user.examinee_id_number,
      course: courseObj,
    }
  })

  return userProfiles;
}

// Custom hook to fetch all users in an institution
const useFetchUsers = (institution_id: string) => {
  const queryClient = useQueryClient()

  // A query to get all users
  const { data: users, isLoading, refetch } = useQuery({
    queryKey: ['profiles', institution_id],
    queryFn: () => fetchUsers(institution_id),
    // We can set a reasonable stale time for the users data, since it may change (e.g. if an admin creates a new account)
    staleTime: 5 * 60 * 1000 // 5 minutes
  })

  // Set up a listener for auth state changes to invalidate the user profile query when the auth user changes (e.g. on sign-in or sign-out)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "USER_UPDATED") {
        // Only invalidate (refetch) when a user explicitly signs in or updates their user record
        queryClient.invalidateQueries({ queryKey: ['profiles', institution_id] });
      } 
      
      else if (event === "SIGNED_OUT") {
        // Completely remove the cached profiles from memory for security
        queryClient.removeQueries({ queryKey: ['profiles', institution_id] });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient, institution_id]);

  return { users: users ?? [], isLoading, refetch };
}


const useFetchStudentsByCourse = (course_id: string) => {
  const queryClient = useQueryClient()

  // A query to get all students
  const { data: students, isLoading, refetch } = useQuery({
    queryKey: ['students', course_id],
    queryFn: () => fetchStudentsByCourse(course_id),
    enabled: !!course_id,
    // We can set a reasonable stale time for the students data, since it may change (e.g. if an admin creates a new account)
    staleTime: 5 * 60 * 1000 // 5 minutes
  })

  // Set up a listener for auth state changes to invalidate the user profile query when the auth user changes (e.g. on sign-in or sign-out)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "USER_UPDATED") {
        // Only invalidate (refetch) when a user explicitly signs in or updates their user record
        queryClient.invalidateQueries({ queryKey: ['students', course_id] });
      } 
      
      else if (event === "SIGNED_OUT") {
        // Completely remove the cached profiles from memory for security
        queryClient.removeQueries({ queryKey: ['students', course_id] });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient, course_id]);

  return { students: students ?? [], isLoading, refetch };
}

export { useFetchUsers, useFetchStudentsByCourse }
