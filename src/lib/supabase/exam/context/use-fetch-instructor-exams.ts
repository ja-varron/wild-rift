import { useQuery } from "@tanstack/react-query"
import { getSupabaseClient } from "../../client"
import type { AnswerKeyItem, Exam, ExamTopic, StudentResult } from "../../../../pages/instructor/exams/types"

const supabase = getSupabaseClient()
const LOCATION_COLUMN_FLAG_KEY = "exam_location_column_supported"

type RowRecord = Record<string, unknown>

const asRecord = (value: unknown): RowRecord | null =>
  value && typeof value === "object" ? (value as RowRecord) : null

const safeJsonParse = (value: string): unknown => {
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

const parsePossiblyJson = (value: unknown): unknown => {
  if (typeof value !== "string") return value
  const trimmed = value.trim()
  if (!trimmed) return null
  const parsed = safeJsonParse(trimmed)
  return parsed ?? trimmed
}

const toNumber = (value: unknown, fallback: number): number => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const toPositiveInt = (value: unknown, fallback: number): number => {
  const parsed = Math.trunc(toNumber(value, fallback))
  return parsed > 0 ? parsed : fallback
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value))

const normalizeExamStatus = (value: unknown): Exam["status"] => {
  const normalized = String(value ?? "").trim().toLowerCase()
  if (["completed", "released", "closed"].includes(normalized)) return "Completed"
  if (["active", "open", "ongoing", "published"].includes(normalized)) return "Active"
  return "Draft"
}

const formatExamDate = (value: unknown): string => {
  const raw = String(value ?? "").trim()
  if (!raw) return "No date"
  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) return "No date"
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

const normalizeTopicId = (value: unknown, fallbackIndex: number): number =>
  toPositiveInt(value, fallbackIndex + 1)

const normalizeTopics = (value: unknown): ExamTopic[] => {
  const source = parsePossiblyJson(value)

  if (Array.isArray(source)) {
    const topics = source
      .map((entry, index) => {
        if (typeof entry === "string") {
          const name = entry.trim()
          if (!name) return null
          return {
            id: index + 1,
            name,
          }
        }

        const record = asRecord(entry)
        if (!record) return null
        const rawName = record.name ?? record.title ?? record.topic
        const name = typeof rawName === "string" ? rawName.trim() : ""
        if (!name) return null

        return {
          id: normalizeTopicId(record.id, index),
          name,
        }
      })
      .filter((entry): entry is ExamTopic => !!entry)

    return topics.length > 0 ? topics : [{ id: 1, name: "General" }]
  }

  if (typeof source === "string") {
    const parts = source
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((name, index) => ({ id: index + 1, name }))
    return parts.length > 0 ? parts : [{ id: 1, name: "General" }]
  }

  return [{ id: 1, name: "General" }]
}

const normalizeChoice = (value: unknown): AnswerKeyItem["correctAnswer"] => {
  const normalized = String(value ?? "A").trim().toUpperCase()
  return ["A", "B", "C", "D", "E"].includes(normalized)
    ? (normalized as AnswerKeyItem["correctAnswer"])
    : "A"
}

const normalizeAnswerKeys = (value: unknown): AnswerKeyItem[] => {
  const source = parsePossiblyJson(value)
  if (!Array.isArray(source)) return []

  return source
    .map((entry, index) => {
      const record = asRecord(entry)
      if (!record) return null

      return {
        questionNumber: toPositiveInt(record.questionNumber ?? record.question_number, index + 1),
        topicId: toPositiveInt(record.topicId ?? record.topic_id, 1),
        correctAnswer: normalizeChoice(record.correctAnswer ?? record.correct_answer),
        points: clamp(toNumber(record.points, 1), 0, 100),
        keyVersion: String(record.keyVersion ?? record.key_version ?? "A").trim() || "A",
      }
    })
    .filter((entry): entry is AnswerKeyItem => !!entry)
    .sort((a, b) => a.questionNumber - b.questionNumber)
}

const normalizeTopicScores = (value: unknown): StudentResult["topicScores"] => {
  const source = parsePossiblyJson(value)
  if (!Array.isArray(source)) return []

  return source
    .map((entry, index) => {
      const record = asRecord(entry)
      if (!record) return null

      return {
        topicId: normalizeTopicId(record.topicId ?? record.topic_id ?? record.id, index),
        score: Math.max(0, toNumber(record.score, 0)),
        maxScore: Math.max(0, toNumber(record.maxScore ?? record.max_score ?? record.max, 0)),
      }
    })
    .filter((entry): entry is StudentResult["topicScores"][number] => !!entry)
}

const formatScannedDate = (value: unknown): string => {
  const raw = String(value ?? "").trim()
  if (!raw) return ""
  const parsed = new Date(raw)
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toLocaleDateString()
}

const normalizeStudentResults = (
  rows: unknown,
  passingRate: number,
  totalItemsFallback: number,
): StudentResult[] => {
  if (!Array.isArray(rows)) return []

  return rows.reduce<StudentResult[]>((acc, row, index) => {
      const record = asRecord(row)
      if (!record) return acc

      const totalItems = toPositiveInt(record.total_items, totalItemsFallback)
      const score = Math.max(0, toNumber(record.score, 0))
      const passed =
        typeof record.passed === "boolean"
          ? record.passed
          : ((score / Math.max(totalItems, 1)) * 100) >= passingRate
      const feedback = String(record.feedback ?? "").trim()

      acc.push({
        id: toPositiveInt(record.id, index + 1),
        name: String(record.student_name ?? record.name ?? "Unknown").trim() || "Unknown",
        studentId: String(record.student_id ?? "").trim(),
        score,
        totalItems,
        passed,
        topicScores: normalizeTopicScores(record.topic_scores),
        scannedAt: formatScannedDate(record.created_at ?? record.updated_at),
        feedback: feedback || undefined,
      })

      return acc
    }, [])
}

const groupResultsByExamId = (rows: unknown): Map<number, RowRecord[]> => {
  const grouped = new Map<number, RowRecord[]>()
  if (!Array.isArray(rows)) return grouped

  for (const row of rows) {
    const record = asRecord(row)
    if (!record) continue

    const examId = toPositiveInt(record.exam_id, -1)
    if (examId <= 0) continue

    const current = grouped.get(examId)
    if (current) {
      current.push(record)
      continue
    }
    grouped.set(examId, [record])
  }

  return grouped
}

const fetchInstructorExams = async (instructorId: string): Promise<Exam[]> => {
  try {
    if (!instructorId) {
      console.debug("No instructor ID provided")
      return []
    }

    console.debug("Fetching exams for instructor:", instructorId)

    // First, get the instructor's PRC exam type to count assigned students
    const { data: instructorData, error: instructorError } = await supabase
      .from("profiles")
      .select("prc_exam_type")
      .eq("user_id", instructorId)
      .eq("role", "Instructor")
      .single()

    let assignedStudentsCount = 0
    if (!instructorError && instructorData?.prc_exam_type) {
      // Count students with the same PRC exam type
      const { count, error: countError } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "Student")
        .eq("prc_exam_type", instructorData.prc_exam_type)
        .eq("is_active", true)

      if (!countError && count !== null) {
        assignedStudentsCount = count
      }
    }

    console.debug("Assigned students count:", assignedStudentsCount)

    // Fetch all exams for this instructor.
    const { data: exams, error: examsError } = await supabase
      .from("exams")
      .select("*")
      .eq("instructor_id", instructorId)
      .order("exam_date", { ascending: false })

    if (examsError) {
      console.error("Error fetching exams:", examsError)
      throw examsError
    }

    console.debug("Raw exams data:", exams)

    if (!exams || exams.length === 0) {
      console.debug("No exams found for instructor")
      return []
    }

    const firstExam = asRecord(exams[0])
    const hasLocationColumn = !!firstExam && Object.prototype.hasOwnProperty.call(firstExam, "location")
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LOCATION_COLUMN_FLAG_KEY, hasLocationColumn ? "true" : "false")
    }

    const examIds = Array.from(
      new Set(exams.map((exam) => toPositiveInt(asRecord(exam)?.id, -1)).filter((id) => id > 0)),
    )

    let groupedResults = new Map<number, RowRecord[]>()
    if (examIds.length > 0) {
      const { data: allResults, error: resultsError } = await supabase
        .from("exam_results")
        .select("*")
        .in("exam_id", examIds)
        .order("created_at", { ascending: false })

      if (resultsError) {
        console.error("Error fetching exam results:", resultsError)
      } else {
        groupedResults = groupResultsByExamId(allResults)
      }
    }

    const examsWithData = exams
      .map((row, index) => {
        const exam = asRecord(row)
        if (!exam) return null

        const examId = toPositiveInt(exam.id, index + 1)
        const totalItems = toPositiveInt(exam.total_items, 100)
        const passingRate = clamp(toNumber(exam.passing_rate, 75), 0, 100)
        const topics = normalizeTopics(exam.topics)
        const answerKeys = normalizeAnswerKeys(exam.answer_keys)
        const studentResults = normalizeStudentResults(
          groupedResults.get(examId),
          passingRate,
          totalItems,
        )

        return {
          id: examId,
          title: String(exam.exam_title ?? exam.title ?? "Untitled Exam").trim() || "Untitled Exam",
          course: String(exam.course_id ?? "General").trim() || "General",
          location: String(exam.location ?? "TBA").trim() || "TBA",
          date: formatExamDate(exam.exam_date),
          totalItems,
          passingRate,
          status: normalizeExamStatus(exam.status),
          studentsEnrolled: assignedStudentsCount,
          papersScanned: studentResults.length,
          topics,
          answerKeys,
          studentResults,
          scannedPapers: [],
        } as Exam
      })
      .filter((exam): exam is Exam => !!exam)

    console.debug("Transformed exams:", examsWithData)
    return examsWithData
  } catch (err) {
    console.error("Error fetching instructor exams:", err)
    return []
  }
}

export const useFetchInstructorExams = (instructorId: string | undefined) => {
  return useQuery({
    queryKey: ["instructorExams", instructorId],
    queryFn: () => fetchInstructorExams(instructorId || ""),
    enabled: !!instructorId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}
