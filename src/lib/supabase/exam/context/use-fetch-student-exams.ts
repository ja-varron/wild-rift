import { useQuery } from "@tanstack/react-query";
import { ExamResult } from "@/model/exam";
import { supabase } from "../../supabase";

type AssignedExamRow = {
  id: number
  exam_title?: string | null
  exam_date?: string | null
  status?: string | null
  total_items?: number | null
  passing_rate?: number | null
  score?: number | null
  result_total_items?: number | null
  passed?: boolean | null
  attempted?: boolean
  feedback?: string | null
  result_created_at?: string | null
}

type InstructorAssignmentRow = {
  instructor_id: string | null
}

type ExamRow = {
  id: number
  exam_title?: string | null
  exam_date?: string | null
  total_items?: number | null
  passing_rate?: number | null
  status?: string | null
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

const hasNonEmptyTopicScores = (value: unknown): boolean => {
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === "string") {
    const trimmed = value.trim()
    if (!trimmed) return false
    try {
      const parsed = JSON.parse(trimmed)
      return Array.isArray(parsed) ? parsed.length > 0 : true
    } catch {
      return true
    }
  }
  return false
}

const hasNonEmptyFeedback = (value: unknown): boolean =>
  typeof value === "string" ? value.trim().length > 0 : Boolean(value)

const isStudentResultVisible = (status: unknown): boolean => {
  const normalized = String(status ?? "").trim().toLowerCase()
  return normalized === "completed" || normalized === "released"
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

const getStudentExams = async (userId: string | undefined): Promise<ExamResult[]> => {
  if (!userId) {
    return [];
  }

  try {
    const backendRows = await fetchAssignedExamsFromBackend(userId)
    if (backendRows) {
      return backendRows.map((exam) => {
        const score = Number(exam?.score ?? 0)
        const totalItems = Number(exam?.result_total_items ?? exam?.total_items ?? 1) || 1
        const baseAttempt =
          exam?.attempted === true
          || (exam?.score !== null && exam?.score !== undefined && exam?.result_total_items !== null && exam?.result_total_items !== undefined)
          || hasNonEmptyFeedback(exam?.feedback)
        const hasAttempt = baseAttempt && isStudentResultVisible(exam?.status)
        const passingRate = Number(exam?.passing_rate ?? 75)
        const passed =
          typeof exam?.passed === "boolean"
            ? exam.passed
            : hasAttempt
            ? Math.round((score / totalItems) * 100) >= passingRate
            : false

        return new ExamResult({
          id: Number(exam.id),
          title: exam.exam_title || `Exam ${exam.id}`,
          date: exam.exam_date ?? exam.result_created_at ?? new Date().toISOString(),
          score,
          total_items: totalItems,
          passed,
          attempted: hasAttempt,
        })
      })
    }

    const { data: assignedRows, error: assignedError } = await supabase
      .from("instructor_students")
      .select("instructor_id")
      .eq("student_id", userId);

    if (assignedError) {
      console.error("Error fetching assigned instructors:", assignedError);
      return [];
    }

    const assignmentRows = (assignedRows || []) as InstructorAssignmentRow[]
    const instructorIds = Array.from(
      new Set(assignmentRows.map((row) => row.instructor_id).filter((id): id is string => Boolean(id))),
    )

    if (instructorIds.length === 0) {
      return [];
    }

    const { data: exams, error: examsError } = await supabase
      .from("exams")
      .select("id, exam_title, exam_date, total_items, passing_rate, status")
      .in("instructor_id", instructorIds)
      .order("exam_date", { ascending: false });

    if (examsError) {
      console.error("Error fetching assigned instructor exams:", examsError);
      return [];
    }

    if (!exams || exams.length === 0) {
      return [];
    }

    const examRows = (exams || []) as ExamRow[]
    const examIds = examRows.map((exam) => exam.id)
    const { data: results, error: resultsError } = await supabase
      .from("exam_results")
      .select("exam_id, score, total_items, passed, topic_scores, feedback, created_at, updated_at")
      .eq("student_id", userId)
      .in("exam_id", examIds)
      .order("updated_at", { ascending: false })
      .order("created_at", { ascending: false });

    if (resultsError) {
      console.error("Error fetching student exam results:", resultsError);
    }

    const resultByExamId = new Map<number, ExamResultRow>()
    for (const row of (results || []) as ExamResultRow[]) {
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

      return new ExamResult({
        id: exam.id,
        title: exam.exam_title || `Exam ${exam.id}`,
        date: exam.exam_date ?? result?.created_at ?? new Date().toISOString(),
        score,
        total_items: totalItems,
        passed,
        attempted: hasAttempt,
      })
    })
  } catch (err) {
    console.error("Error fetching student exams:", err);
    return [];
  }
};

export const useFetchStudentExams = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["studentExams", userId],
    queryFn: () => getStudentExams(userId),
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!userId,
  });
};
