import type { ScoreResult, TopicScore } from "@/pages/instructor/exams/types"
import { supabase } from "../../supabase"
import { useEffect } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"

// ── Dashboard exam result shape (student-centric) ─────────────────────────────
export type DashboardExamResult = {
  id: string
  title: string
  date: string
  course: string
  attempted: boolean
  passed: boolean
  percentage: number
  score: number
  totalItems: number
}

type ScoreTopicPayload = {
  topicId?: number
  topicName?: string
  score?: number
  maxScore?: number
  total?: number
  percent?: number
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
  answerKeyVersion?: string
  scannedAt?: string
  topicScores?: ScoreTopicPayload[]
}

function parseScorePayload(value: unknown): ScorePayload {
  if (!value) return {}
  if (Array.isArray(value)) return { topicScores: value as ScoreTopicPayload[] }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown
      if (Array.isArray(parsed)) {
        return { topicScores: parsed as ScoreTopicPayload[] }
      }
      return (parsed ?? {}) as ScorePayload
    } catch {
      return {}
    }
  }
  return value as ScorePayload
}

function normalizeTopicScores(raw: ScoreTopicPayload[] | undefined): TopicScore[] {
  if (!Array.isArray(raw)) return []

  return raw.map((entry, index) => {
    const topicIdx =
      (typeof entry.topic?.topic_idx === "number" && Number.isFinite(entry.topic.topic_idx)
        ? entry.topic.topic_idx
        : undefined) ??
      (typeof entry.topicId === "number" && Number.isFinite(entry.topicId)
        ? entry.topicId
        : index + 1)

    const name =
      (typeof entry.topic?.name === "string" && entry.topic.name.trim()) ||
      (typeof entry.topicName === "string" && entry.topicName.trim()) ||
      `Topic ${index + 1}`

    const score = Number.isFinite(Number(entry.score)) ? Number(entry.score) : 0
    const total = Number.isFinite(Number(entry.total))
      ? Number(entry.total)
      : Number.isFinite(Number(entry.maxScore))
        ? Number(entry.maxScore)
        : 0

    return {
      topic: {
        topic_idx: topicIdx,
        name,
      },
      score,
      total,
    }
  })
}

// This hook fetches the score results for a specific exam, including the topic-wise breakdown of scores for each student.
const getStudentScoreResults = async (exam_id: string) : Promise<ScoreResult[]> => {
  const { data, error } = await supabase
    .from('score_results')
    .select('exam_id, profiles!inner(user_id, first_name, last_name, examinee_id_number), scores, scanned_at')
    .eq('exam_id', exam_id)

  if (error) {
    console.error("Error fetching score results:", error)
    throw new Error(error.message)
  }

  const scoreResults: ScoreResult[] = (data ?? []).map((item) => {
    const profile = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles
    const payload = parseScorePayload(item.scores)
    const topicScores = normalizeTopicScores(payload.topicScores)

    return {
      exam_id: item.exam_id,
      student: {
        student_id: profile?.user_id,
        first_name: profile?.first_name,
        last_name: profile?.last_name,
        examinee_id_number: profile?.examinee_id_number,
      },
      topicScores,
      scanned_at: item.scanned_at || payload.scannedAt || "",
      totalScore: payload.totalScore,
      totalItems: payload.totalItems,
      passed: payload.passed,
      scorePercent: payload.scorePercent,
      answerKeyVersion: payload.answerKeyVersion,
    }
  })

  return scoreResults
}


const useFetchScoreResults = (examId: string) => {
  const queryClient = useQueryClient()

  const { data: scoreResults, isLoading, refetch } = useQuery({
    queryKey: ["scoreResults", examId],
    queryFn: () => getStudentScoreResults(examId),
    enabled: !!examId,
    staleTime: 5 * 60 * 1000, // Cache score results for 5 minutes
  })

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "USER_UPDATED") {
        // Only invalidate (refetch) when a user explicitly signs in or updates their user record
        queryClient.invalidateQueries({ queryKey: ['scoreResults', examId] });
      } 
      
      else if (event === "SIGNED_OUT") {
        // Optionally, you could clear the score results from the cache on sign-out for security reasons
        queryClient.removeQueries({ queryKey: ['scoreResults', examId] });
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [queryClient, examId])

  return { scoreResults, isLoading, refetch }
}

export { useFetchScoreResults }

// ── Student-scoped fetch: all exams the student has score results for ──────────

const getScoreResultsByStudent = async (studentId: string): Promise<DashboardExamResult[]> => {
  const { data, error } = await supabase
    .from('score_results')
    .select(`
      score_result_id,
      exam_id,
      scores,
      scanned_at,
      exams!inner(
        exam_id,
        exam_title,
        exam_date,
        total_items,
        passing_rate,
        courses(course_name)
      )
    `)
    .eq('student_id', studentId)
    .order('scanned_at', { ascending: false })

  if (error) {
    console.error("Error fetching student score results:", error)
    throw new Error(error.message)
  }

  return (data ?? []).map((row) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const exam = (Array.isArray((row as any).exams) ? (row as any).exams[0] : (row as any).exams) ?? {}
    const rawCourse = Array.isArray(exam.courses) ? exam.courses[0] : exam.courses
    const courseName: string = rawCourse?.course_name ?? "Course"

    const payload = parseScorePayload(row.scores)

    const totalItems = Math.max(1, Number(payload.totalItems ?? exam.total_items ?? 1) || 1)
    const passingRate = Number(exam.passing_rate ?? 75) || 75

    const derivedScore =
      payload.scorePercent !== undefined && payload.scorePercent !== null
        ? Math.round((Number(payload.scorePercent) / 100) * totalItems)
        : 0
    const score = Number(payload.totalScore ?? derivedScore) || 0

    const percentage =
      payload.scorePercent !== undefined && payload.scorePercent !== null
        ? Math.round(Number(payload.scorePercent))
        : totalItems > 0
          ? Math.round((score / totalItems) * 100)
          : 0

    const passed =
      typeof payload.passed === "boolean"
        ? payload.passed
        : percentage >= passingRate

    return {
      id: row.score_result_id ?? `${row.exam_id}-${studentId}`,
      title: exam.exam_title ?? `Exam ${row.exam_id}`,
      date: exam.exam_date ?? row.scanned_at ?? new Date().toISOString(),
      course: courseName,
      attempted: true, // Row exists in score_results → attempted
      passed,
      percentage,
      score,
      totalItems,
    }
  })
}

const useFetchScoreResultsByStudent = (studentId: string | undefined) => {
  const queryClient = useQueryClient()

  const { data: examResults, isLoading, refetch } = useQuery({
    queryKey: ["scoreResultsByStudent", studentId],
    queryFn: () => getScoreResultsByStudent(studentId!),
    enabled: !!studentId,
    staleTime: 5 * 60 * 1000,
  })

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "USER_UPDATED") {
        queryClient.invalidateQueries({ queryKey: ['scoreResultsByStudent', studentId] })
      } else if (event === "SIGNED_OUT") {
        queryClient.removeQueries({ queryKey: ['scoreResultsByStudent', studentId] })
      }
    })
    return () => { subscription.unsubscribe() }
  }, [queryClient, studentId])

  return { examResults: examResults ?? [], isLoading, refetch }
}

export { useFetchScoreResultsByStudent }