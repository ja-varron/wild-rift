import type { UserProfile } from "@/model/user-profile";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/supabase";
import { useEffect } from "react";
import type { Student } from "@/pages/instructor/students/types";

// ── Shared payload types ───────────────────────────────────────────────────────

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
  scorePercent?: number
  passed?: boolean
  topicScores?: ScoreTopicPayload[]
}

type ExamRow = {
  exam_id: string
  exam_title: string | null
  exam_date: string | null
  total_items: number | null
  passing_rate: number | null
  courses: { course_name: string | null } | { course_name: string | null }[] | null
}

type ScoreResultRow = {
  score_result_id: string | null
  exam_id: string
  student_id: string
  scores: unknown
  scanned_at: string | null
}

type FeedbackRow = {
  exam_id: string
  student_id: string
  comment: string | null
  message_at: string | null
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

    return { topicId, topicName, score, maxScore }
  })
}

// ── Exam-first fetch (mirrors use-fetch-exam-details.ts approach) ──────────────
//
// Pattern:
//   1. Fetch students enrolled in the course via course_enrollment
//   2. Fetch ALL exams for the course
//   3. Fetch score_results for all student-exam pairs in batch
//   4. Fetch feedbacks for all student-exam pairs in batch
//   5. Compose Student[] where each student has ExamResult[] for EVERY exam
//      (attempted=true only when a score_result or feedback exists)
//
const fetchStudentsByCourse = async (course_id: string): Promise<Student[]> => {
  if (!course_id) throw new Error("Course ID is required to fetch students")

  // 1. Enrolled students
  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select(`
      user_id, first_name, last_name, email, examinee_id_number,
      course_enrollment!inner(course_id)
    `)
    .eq("role", "Student")
    .eq("course_enrollment.course_id", course_id)

  if (profileError) {
    console.error("Error fetching students by course:", profileError)
    throw new Error(profileError.message)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const students: Student[] = (profileData ?? []).map((s: any) => ({
    user_id: s.user_id,
    name: `${s.first_name ?? ""} ${s.last_name ?? ""}`.trim(),
    email: s.email,
    examinee_id_number: s.examinee_id_number,
    examResults: [],
  }))

  if (students.length === 0) return students

  const studentIds = students.map((s) => s.user_id)

  // 2. All exams in this course
  const { data: examData, error: examError } = await supabase
    .from("exams")
    .select("exam_id, exam_title, exam_date, total_items, passing_rate, courses(course_name)")
    .eq("course_id", course_id)
    .order("exam_date", { ascending: false })

  if (examError) {
    console.error("Error fetching exams for course:", examError)
    return students
  }

  const exams = (examData ?? []) as ExamRow[]
  if (exams.length === 0) return students

  const examIds = exams.map((e) => e.exam_id)

  const rawCourseObj = exams[0]?.courses
  const firstCourse = Array.isArray(rawCourseObj) ? rawCourseObj[0] : rawCourseObj
  const courseName = firstCourse?.course_name ?? "Course"

  // 3. Score results for all students across all exams (batch)
  const { data: scoreData, error: scoreError } = await supabase
    .from("score_results")
    .select("score_result_id, exam_id, student_id, scores, scanned_at")
    .in("exam_id", examIds)
    .in("student_id", studentIds)
    .order("scanned_at", { ascending: false })

  if (scoreError) {
    console.error("Error fetching score results:", scoreError)
  }

  // 4. Feedbacks for all students across all exams (batch)
  const { data: feedbackData, error: feedbackError } = await supabase
    .from("feedbacks")
    .select("exam_id, student_id, comment, message_at")
    .in("exam_id", examIds)
    .in("student_id", studentIds)
    .order("message_at", { ascending: false })

  if (feedbackError) {
    console.error("Error fetching feedbacks:", feedbackError)
  }

  // Lookup maps: key = `${examId}-${studentId}` (latest row wins)
  const scoreByKey = new Map<string, ScoreResultRow>()
  for (const row of (scoreData ?? []) as ScoreResultRow[]) {
    const key = `${row.exam_id}-${row.student_id}`
    if (!scoreByKey.has(key)) scoreByKey.set(key, row)
  }

  const feedbackByKey = new Map<string, FeedbackRow>()
  for (const row of (feedbackData ?? []) as FeedbackRow[]) {
    const key = `${row.exam_id}-${row.student_id}`
    if (!feedbackByKey.has(key)) feedbackByKey.set(key, row)
  }

  // 5. Compose Student[] — every student gets a result for every exam
  return students.map((student) => {
    const examResults: Student["examResults"] = exams.map((exam) => {
      const key = `${exam.exam_id}-${student.user_id}`
      const scoreRow = scoreByKey.get(key)
      const feedbackRow = feedbackByKey.get(key)

      const payload = parseScorePayload(scoreRow?.scores)
      const totalItems = Math.max(1, Number(payload.totalItems ?? exam.total_items ?? 1) || 1)
      const passingRate = Number(exam.passing_rate ?? 75) || 75

      const derivedScore =
        payload.scorePercent !== undefined && payload.scorePercent !== null
          ? Math.round((Number(payload.scorePercent) / 100) * totalItems)
          : 0
      const score = Number(payload.totalScore ?? derivedScore) || 0

      const feedbackComment =
        typeof feedbackRow?.comment === "string" ? feedbackRow.comment.trim() : undefined

      const attempted = Boolean(scoreRow) || Boolean(feedbackComment)

      const pct =
        payload.scorePercent !== undefined && payload.scorePercent !== null
          ? Math.round(Number(payload.scorePercent))
          : totalItems > 0
            ? Math.round((score / totalItems) * 100)
            : 0

      const passed =
        typeof payload.passed === "boolean"
          ? payload.passed
          : attempted
            ? pct >= passingRate
            : false

      const topicScores = attempted ? normalizeTopicScores(payload.topicScores) : []

      const rawDate = exam.exam_date ?? scoreRow?.scanned_at ?? new Date().toISOString()
      const date = new Date(rawDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })

      return {
        id: scoreRow?.score_result_id ?? `${exam.exam_id}-${student.user_id}`,
        examTitle: exam.exam_title ?? `Exam ${exam.exam_id}`,
        course: courseName,
        date,
        score,
        totalItems,
        passingRate,
        passed,
        attempted,
        topicScores,
        feedback: feedbackComment,
      }
    })

    return { ...student, examResults }
  })
}


// ── fetchUsers: all users in an institution ────────────────────────────────────

const fetchUsers = async (institution_id: string): Promise<UserProfile[]> => {
  if (!institution_id) {
    throw new Error("Institution ID is required to fetch users")
  }

  const { data, error } = await supabase
    .from("profiles")
    .select(
      `user_id, first_name, middle_name, last_name, email, role,      examinee_id_number, institution_id, created_at,
       course_enrollment(
         courses(course_id, course_name)
       )`,
    )
    .eq("institution_id", institution_id)
    .in("role", ["Student", "Instructor"])
    .order("created_at", { ascending: true })

  if (error) {
    console.error("Error fetching users:", error)
    throw new Error(error.message)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userProfiles: UserProfile[] = (data || []).map((user: any) => {
    const firstCourseItem =
      Array.isArray(user.course_enrollment) && user.course_enrollment.length > 0
        ? user.course_enrollment[0]
        : user.course_enrollment

    const courseObj = firstCourseItem?.courses
      ? {
          course_id: firstCourseItem.courses.course_id,
          course_name: firstCourseItem.courses.course_name,
        }
      : null

    return {
      user_id: user.user_id,
      first_name: user.first_name,
      middle_name: user.middle_name,
      last_name: user.last_name,
      email: user.email,
      role: user.role,
      institution_id: user.institution_id,
      examinee_id_number: user.examinee_id_number,
      created_at: user.created_at,
      course: courseObj,
    }
  })

  return userProfiles
}

// ── Custom hooks ───────────────────────────────────────────────────────────────

const useFetchUsers = (institution_id: string) => {
  const queryClient = useQueryClient()

  const { data: users, isLoading, refetch } = useQuery({
    queryKey: ["profiles", institution_id],
    queryFn: () => fetchUsers(institution_id),
    staleTime: 5 * 60 * 1000,
  })

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "USER_UPDATED") {
        queryClient.invalidateQueries({ queryKey: ["profiles", institution_id] })
      } else if (event === "SIGNED_OUT") {
        queryClient.removeQueries({ queryKey: ["profiles", institution_id] })
      }
    })
    return () => { subscription.unsubscribe() }
  }, [queryClient, institution_id])

  return { users: users ?? [], isLoading, refetch }
}

const useFetchStudentsByCourse = (course_id: string) => {
  const queryClient = useQueryClient()

  const { data: students, isLoading, refetch } = useQuery({
    queryKey: ["students", course_id],
    queryFn: () => fetchStudentsByCourse(course_id),
    enabled: !!course_id,
    staleTime: 5 * 60 * 1000,
  })

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "USER_UPDATED") {
        queryClient.invalidateQueries({ queryKey: ["students", course_id] })
      } else if (event === "SIGNED_OUT") {
        queryClient.removeQueries({ queryKey: ["students", course_id] })
      }
    })
    return () => { subscription.unsubscribe() }
  }, [queryClient, course_id])

  return { students: students ?? [], isLoading, refetch }
}

export { useFetchUsers, useFetchStudentsByCourse }



