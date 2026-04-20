import { useQuery } from "@tanstack/react-query"
import { supabase } from "../../supabase"

type AssignedExamRow = {
  id: number
  exam_title?: string | null
  exam_date?: string | null
  status?: string | null
  total_items?: number | null
  passing_rate?: number | null
  topics?: unknown
  score?: number | null
  result_total_items?: number | null
  passed?: boolean | null
  topic_scores?: unknown
  attempted?: boolean
  feedback?: string | null
  instructor_name?: string | null
  instructor_id?: string | null
  result_created_at?: string | null
}

type InstructorAssignmentRow = {
  instructor_id: string | null
}

type InstructorExamRow = {
  id: number
  exam_title?: string | null
  exam_date?: string | null
  total_items?: number | null
  passing_rate?: number | null
  status?: string | null
  instructor_id?: string | null
  topics?: unknown
}

type ProfileRow = {
  user_id: string
  first_name?: string | null
  last_name?: string | null
  email?: string | null
}

type ExamResultRow = {
  exam_id: number
  score?: number | null
  total_items?: number | null
  passed?: boolean | null
  topic_scores?: unknown
  feedback?: string | null
  created_at?: string | null
  updated_at?: string | null
}

interface TopicScore {
  topic: string
  score: number
  maxScore: number
}

interface FeedbackItem {
  type: "strength" | "improvement" | "warning"
  text: string
}

export interface ExamRecord {
  id: number
  title: string
  date: string
  instructor: string
  score: number
  totalItems: number
  passed: boolean
  attempted: boolean
  topics: TopicScore[]
  feedback: FeedbackItem[]
  recommendation: string
}

type TopicDefinition = {
  id: string
  name: string
}

const safeJsonParse = (value: string): unknown => {
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

const toNumber = (value: unknown, fallback = 0): number => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const hasNonEmptyTopicScores = (value: unknown): boolean => {
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === "string") {
    const trimmed = value.trim()
    if (!trimmed) return false
    const parsed = safeJsonParse(trimmed)
    return Array.isArray(parsed) ? parsed.length > 0 : true
  }
  return false
}

const hasNonEmptyFeedback = (value: unknown): boolean =>
  typeof value === "string" ? value.trim().length > 0 : Boolean(value)

const isStudentResultVisible = (status: unknown): boolean => {
  const normalized = String(status ?? "").trim().toLowerCase()
  return normalized === "completed" || normalized === "released"
}

const normalizeTopicDefinitions = (raw: unknown): TopicDefinition[] => {
  let source: unknown = raw
  if (typeof source === "string") {
    source = safeJsonParse(source)
  }

  if (!Array.isArray(source)) {
    return []
  }

  return source
    .map((item, idx) => {
      if (typeof item === "string") {
        const name = item.trim()
        return name ? { id: String(idx + 1), name } : null
      }

      if (item && typeof item === "object") {
        const value = item as { id?: unknown; name?: unknown; title?: unknown; topic?: unknown }
        const id = value.id !== undefined && value.id !== null ? String(value.id) : String(idx + 1)
        const nameCandidate = value.name ?? value.title ?? value.topic
        const name = typeof nameCandidate === "string" ? nameCandidate.trim() : ""
        return name ? { id, name } : null
      }

      return null
    })
    .filter((entry): entry is TopicDefinition => !!entry)
}

type ParsedTopicScore = {
  topicId: string | null
  score: number
  maxScore: number
}

const normalizeTopicScores = (raw: unknown): ParsedTopicScore[] => {
  let source: unknown = raw
  if (typeof source === "string") {
    source = safeJsonParse(source)
  }

  if (!Array.isArray(source)) {
    return []
  }

  return source.reduce<ParsedTopicScore[]>((acc, item) => {
      if (!item || typeof item !== "object") return acc
      const value = item as {
        topicId?: unknown
        topic_id?: unknown
        id?: unknown
        score?: unknown
        maxScore?: unknown
        max_score?: unknown
        max?: unknown
      }

      const topicIdRaw = value.topicId ?? value.topic_id ?? value.id
      const topicId = topicIdRaw !== undefined && topicIdRaw !== null ? String(topicIdRaw) : null
      const score = Math.max(0, toNumber(value.score, 0))
      const maxScore = Math.max(0, toNumber(value.maxScore ?? value.max_score ?? value.max, 0))

      acc.push({
        topicId,
        score,
        maxScore,
      })
      return acc
    }, [])
}

const buildTopicBreakdown = (
  rawTopicScores: unknown,
  rawTopicDefinitions: unknown,
  totalItems: number,
  overallScore: number,
): TopicScore[] => {
  const topicDefinitions = normalizeTopicDefinitions(rawTopicDefinitions)
  const topicScores = normalizeTopicScores(rawTopicScores)

  if (topicScores.length > 0) {
    const defaultMax = Math.max(1, Math.round(totalItems / topicScores.length))
    return topicScores.map((entry, index) => {
      const byId = entry.topicId
        ? topicDefinitions.find((topic) => topic.id === entry.topicId)
        : undefined
      const fallbackByIndex = topicDefinitions[index]
      return {
        topic: byId?.name || fallbackByIndex?.name || `Topic ${index + 1}`,
        score: entry.score,
        maxScore: entry.maxScore > 0 ? entry.maxScore : defaultMax,
      }
    })
  }

  if (topicDefinitions.length > 0) {
    const defaultMax = Math.max(1, Math.round(totalItems / topicDefinitions.length))
    return topicDefinitions.map((entry) => ({
      topic: entry.name,
      score: 0,
      maxScore: defaultMax,
    }))
  }

  return [
    {
      topic: "General Performance",
      score: overallScore,
      maxScore: Math.max(totalItems, 1),
    },
  ]
}

const fetchAssignedExamsFromBackend = async (userId: string): Promise<AssignedExamRow[] | null> => {
  try {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"
    const endpoints = [
      `${backendUrl}/api/students/${userId}/assigned-exams`,
      `${backendUrl}/api/assignments/students/${userId}/assigned-exams`,
    ]

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint)
        if (!response.ok) {
          // Keep trying fallback endpoints before giving up.
          continue
        }

        const payload = await response.json().catch(() => ({}))
        if (!Array.isArray(payload?.exams)) {
          return []
        }

        return payload.exams as AssignedExamRow[]
      } catch {
        continue
      }
    }

    return null
  } catch {
    return null
  }
}

const fetchExamDetails = async (userId: string): Promise<ExamRecord[]> => {
  try {
    if (!userId) return []

    const backendRows = await fetchAssignedExamsFromBackend(userId)
    if (backendRows) {
      return backendRows.map((exam) => {
        const score = Number(exam?.score ?? 0)
        const totalItems = Number(exam?.result_total_items ?? exam?.total_items ?? 1) || 1
        const passingRate = Number(exam?.passing_rate ?? 75)
        const baseAttempt =
          exam?.attempted === true
          || (exam?.score !== null && exam?.score !== undefined && exam?.result_total_items !== null && exam?.result_total_items !== undefined)
          || hasNonEmptyTopicScores(exam?.topic_scores)
          || hasNonEmptyFeedback(exam?.feedback)
        const hasAttempt = baseAttempt && isStudentResultVisible(exam?.status)
        const passed =
          typeof exam?.passed === "boolean"
            ? exam.passed
            : hasAttempt
            ? Math.round((score / totalItems) * 100) >= passingRate
            : false
        const instructorFeedback = typeof exam?.feedback === "string" ? exam.feedback.trim() : ""
        const topicBreakdown = hasAttempt
          ? buildTopicBreakdown(
              exam?.topic_scores,
              exam?.topics,
              totalItems,
              score,
            )
          : []

        return {
          id: Number(exam.id),
          title: exam.exam_title || `Exam ${exam.id}`,
          date: new Date(exam.exam_date || exam.result_created_at || new Date().toISOString()).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          instructor: exam.instructor_name || "Assigned Instructor",
          score,
          totalItems,
          passed,
          attempted: hasAttempt,
          topics: topicBreakdown,
          feedback: instructorFeedback
            ? [
                {
                  type: "improvement" as const,
                  text: instructorFeedback,
                },
              ]
            : [],
          recommendation: hasAttempt
            ? passed
              ? "Continue maintaining your performance level. Review challenging topics periodically."
              : "Focus on reviewing exam topics and practice similar questions before your next attempt."
            : "No submitted result yet. Your exam result will appear after scanning and submission.",
        }
      })
    }

    const { data: assignedRows, error: assignedError } = await supabase
      .from("instructor_students")
      .select("instructor_id")
      .eq("student_id", userId)

    if (assignedError) {
      console.error("Error fetching assigned instructors:", assignedError)
      return []
    }

    const assignmentRows = (assignedRows || []) as InstructorAssignmentRow[]
    const instructorIds = Array.from(
      new Set(assignmentRows.map((row) => row.instructor_id).filter((id): id is string => Boolean(id))),
    )

    if (instructorIds.length === 0) {
      return []
    }

    const { data: exams, error: examsError } = await supabase
      .from("exams")
      .select("id, exam_title, exam_date, total_items, passing_rate, status, instructor_id, topics")
      .in("instructor_id", instructorIds)
      .order("exam_date", { ascending: false })

    if (examsError) {
      console.error("Error fetching assigned exams:", examsError)
      return []
    }

    if (!exams || exams.length === 0) {
      return []
    }

    const examRows = (exams || []) as InstructorExamRow[]
    const uniqueInstructorIds = Array.from(
      new Set(examRows.map((row) => row.instructor_id).filter((id): id is string => Boolean(id))),
    )
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, first_name, last_name, email")
      .in("user_id", uniqueInstructorIds)

    const instructorNameById = new Map<string, string>()
    for (const row of (profiles || []) as ProfileRow[]) {
      const fullName = `${row.first_name || ""} ${row.last_name || ""}`.trim()
      instructorNameById.set(row.user_id, fullName || row.email || "Assigned Instructor")
    }

    const examIds = examRows.map((exam) => exam.id)
    const { data: examResults, error: resultsError } = await supabase
      .from("exam_results")
      .select("exam_id, score, total_items, passed, topic_scores, feedback, created_at, updated_at")
      .eq("student_id", userId)
      .in("exam_id", examIds)
      .order("updated_at", { ascending: false })
      .order("created_at", { ascending: false })

    if (resultsError) {
      console.error("Error fetching exam details:", resultsError)
    }

    const resultByExamId = new Map<number, ExamResultRow>()
    for (const row of (examResults || []) as ExamResultRow[]) {
      if (!resultByExamId.has(row.exam_id)) {
        resultByExamId.set(row.exam_id, row)
      }
    }

    return examRows.map((exam) => {
      const result = resultByExamId.get(exam.id)
      const score = Number(result?.score ?? 0)
      const totalItems = Number(result?.total_items ?? exam.total_items ?? 1) || 1
      const passingRate = Number(exam?.passing_rate ?? 75)
      const baseAttempt =
        !!result
        && (
          (result?.score !== null && result?.score !== undefined && result?.total_items !== null && result?.total_items !== undefined)
          || hasNonEmptyTopicScores(result?.topic_scores)
          || hasNonEmptyFeedback(result?.feedback)
        )
      const hasAttempt = baseAttempt && isStudentResultVisible(exam?.status)
      const passed =
        typeof result?.passed === "boolean"
          ? result.passed
          : hasAttempt
          ? Math.round((score / totalItems) * 100) >= passingRate
          : false
      const instructorFeedback = typeof result?.feedback === "string" ? result.feedback.trim() : ""
      const topicBreakdown = hasAttempt
        ? buildTopicBreakdown(
            result?.topic_scores,
            exam?.topics,
            totalItems,
            score,
          )
        : []

      return {
        id: exam.id,
        title: exam.exam_title || `Exam ${exam.id}`,
        date: new Date(exam.exam_date || result?.created_at || new Date().toISOString()).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        instructor: (exam.instructor_id ? instructorNameById.get(exam.instructor_id) : undefined) || "Assigned Instructor",
        score,
        totalItems,
        passed,
        attempted: hasAttempt,
        topics: topicBreakdown,
        feedback: instructorFeedback
          ? [
              {
                type: "improvement" as const,
                text: instructorFeedback,
              },
            ]
          : [],
        recommendation: hasAttempt
          ? passed
            ? "Continue maintaining your performance level. Review challenging topics periodically."
            : "Focus on reviewing exam topics and practice similar questions before your next attempt."
          : "No submitted result yet. Your exam result will appear after scanning and submission.",
      }
    })
  } catch (err) {
    console.error("Error fetching exam details:", err)
    return []
  }
}

export const useFetchExamDetails = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["examDetails", userId],
    queryFn: () => fetchExamDetails(userId || ""),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

