import { getSupabaseClient } from "../client"
import { autoEnrollInstructorStudents } from "../enrollment/enrollment-service"
import type { ExamTopic, AnswerKeyItem, StudentResult, ScannedPaper } from "@/pages/instructor/exams/types"

const supabase = getSupabaseClient()
const LOCATION_COLUMN_FLAG_KEY = "exam_location_column_supported"

function getLocationColumnSupport(): boolean | undefined {
  if (typeof window === "undefined") return undefined
  const value = window.localStorage.getItem(LOCATION_COLUMN_FLAG_KEY)
  if (value === "true") return true
  if (value === "false") return false
  return undefined
}

function setLocationColumnSupport(supported: boolean) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(LOCATION_COLUMN_FLAG_KEY, supported ? "true" : "false")
}

function isMissingLocationColumnError(error: unknown): boolean {
  const message = String((error as { message?: string })?.message || "").toLowerCase()
  const details = String((error as { details?: string })?.details || "").toLowerCase()
  return (
    (message.includes("location") && message.includes("column")) ||
    (details.includes("location") && details.includes("column"))
  )
}

// ─── Create Exam ───────────────────────────────────────────────────────────────

export const createExam = async (
  instructorId: string,
  examData: {
    title: string
    course: string
    location?: string
    examDate: string
    totalItems: number
    passingRate: number
    topics: string[]
  }
) => {
  try {
    console.debug("Creating exam with data:", { instructorId, examData })
    const normalizedLocation = examData.location?.trim() || "TBA"
    const locationSupport = getLocationColumnSupport()

    const insertPayload: Record<string, unknown> = {
      instructor_id: instructorId,
      exam_title: examData.title,
      course_id: examData.course,
      exam_date: new Date(examData.examDate).toISOString(),
      total_items: examData.totalItems,
      passing_rate: examData.passingRate,
      topics: JSON.stringify(
        examData.topics.map((name, i) => ({
          id: Date.now() + i,
          name,
        }))
      ),
      status: "Draft",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    if (locationSupport !== false) {
      insertPayload.location = normalizedLocation
    }

    let { data, error } = await supabase
      .from("exams")
      .insert(insertPayload)
      .select()
      .single()

    if (error && isMissingLocationColumnError(error)) {
      setLocationColumnSupport(false)
      delete insertPayload.location
      ;({ data, error } = await supabase
        .from("exams")
        .insert(insertPayload)
        .select()
        .single())
      console.warn("Location column missing in DB; exam was created without location")
    }

    if (!error && Object.prototype.hasOwnProperty.call(insertPayload, "location")) {
      setLocationColumnSupport(true)
    }

    if (error) {
      console.error("Supabase insert error:", error)
      throw error
    }
    
    console.debug("Exam created successfully:", data)

    // Auto-enroll all students under this instructor
    if (data && data.id) {
      const enrollmentResult = await autoEnrollInstructorStudents(data.id, instructorId)
      console.debug(`Auto-enrollment result: ${enrollmentResult.enrolledCount} students`, enrollmentResult)
    }

    return { success: true, data }
  } catch (err) {
    console.error("Error creating exam:", err)
    return { success: false, error: err instanceof Error ? err.message : "Failed to create exam" }
  }
}

// ─── Update Exam ───────────────────────────────────────────────────────────────

export const updateExam = async (
  examId: number,
  examData: Partial<{
    title: string
    course: string
    location: string
    examDate: string
    totalItems: number
    passingRate: number
    topics: ExamTopic[]
    status: "Draft" | "Active" | "Completed"
  }>
) => {
  try {
    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }
    const locationSupport = getLocationColumnSupport()

    if (examData.title) updatePayload.exam_title = examData.title
    if (examData.course) updatePayload.course_id = examData.course
    if (typeof examData.location === "string" && locationSupport !== false) {
      updatePayload.location = examData.location.trim() || "TBA"
    }
    if (examData.examDate) updatePayload.exam_date = new Date(examData.examDate).toISOString()
    if (examData.totalItems) updatePayload.total_items = examData.totalItems
    if (examData.passingRate) updatePayload.passing_rate = examData.passingRate
    if (examData.topics) updatePayload.topics = JSON.stringify(examData.topics)
    if (examData.status) updatePayload.status = examData.status

    let { error } = await supabase
      .from("exams")
      .update(updatePayload)
      .eq("id", examId)

    if (error && isMissingLocationColumnError(error) && Object.prototype.hasOwnProperty.call(updatePayload, "location")) {
      setLocationColumnSupport(false)
      delete updatePayload.location
      ;({ error } = await supabase
        .from("exams")
        .update(updatePayload)
        .eq("id", examId))
      console.warn("Location column missing in DB; exam was updated without location")
    }

    if (!error && Object.prototype.hasOwnProperty.call(updatePayload, "location")) {
      setLocationColumnSupport(true)
    }

    if (error) throw error
    return { success: true, data: null }
  } catch (err) {
    console.error("Error updating exam:", err)
    return { success: false, error: err instanceof Error ? err.message : "Failed to update exam" }
  }
}

// ─── Delete Exam ───────────────────────────────────────────────────────────────

export const deleteExam = async (examId: number) => {
  try {
    const { error } = await supabase
      .from("exams")
      .delete()
      .eq("id", examId)

    if (error) throw error
    return { success: true }
  } catch (err) {
    console.error("Error deleting exam:", err)
    return { success: false, error: err instanceof Error ? err.message : "Failed to delete exam" }
  }
}

// ─── Update Exam Status ────────────────────────────────────────────────────────

export const updateExamStatus = async (
  examId: number,
  status: "Draft" | "Active" | "Completed"
) => {
  try {
    const { data, error } = await supabase
      .from("exams")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", examId)
      .select()
      .single()

    if (error) throw error
    return { success: true, data }
  } catch (err) {
    console.error("Error updating exam status:", err)
    return { success: false, error: err instanceof Error ? err.message : "Failed to update exam status" }
  }
}

// ─── Save Answer Key ───────────────────────────────────────────────────────────

export const saveAnswerKey = async (
  examId: number,
  answerKey: AnswerKeyItem[]
) => {
  try {
    const { data, error } = await supabase
      .from("exams")
      .update({
        answer_keys: JSON.stringify(answerKey),
        updated_at: new Date().toISOString(),
      })
      .eq("id", examId)
      .select()
      .single()

    if (error) throw error
    return { success: true, data }
  } catch (err) {
    console.error("Error saving answer key:", err)
    return { success: false, error: err instanceof Error ? err.message : "Failed to save answer key" }
  }
}

// ─── Save Exam Results ──────────────────────────────────────────────────────────

export const saveExamResults = async (
  examId: number,
  studentResults: StudentResult[]
) => {
  try {
    // Save each student result
    const results = await Promise.all(
      studentResults.map((result) =>
        supabase
          .from("exam_results")
          .upsert({
            exam_id: examId,
            student_id: result.studentId,
            student_name: result.name,
            score: result.score,
            total_items: result.totalItems,
            passed: result.passed,
            topic_scores: JSON.stringify(result.topicScores),
            feedback: result.feedback || "",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
      )
    )

    return { success: true, data: results }
  } catch (err) {
    console.error("Error saving exam results:", err)
    return { success: false, error: err instanceof Error ? err.message : "Failed to save exam results" }
  }
}

// ─── Save Scanned Paper ────────────────────────────────────────────────────────

export const saveScannedPaper = async (
  examId: number,
  scannedPaper: ScannedPaper
) => {
  try {
    const { data, error } = await supabase
      .from("scanned_papers")
      .insert({
        exam_id: examId,
        student_name: scannedPaper.studentName,
        student_id: scannedPaper.studentId,
        status: scannedPaper.status,
        scanned_at: new Date(scannedPaper.scannedAt).toISOString(),
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error
    return { success: true, data }
  } catch (err) {
    console.error("Error saving scanned paper:", err)
    return { success: false, error: err instanceof Error ? err.message : "Failed to save scanned paper" }
  }
}

// ─── Get Exam by ID ────────────────────────────────────────────────────────────

export const getExamById = async (examId: number) => {
  try {
    const { data, error } = await supabase
      .from("exams")
      .select("*")
      .eq("id", examId)
      .single()

    if (error) throw error
    return { success: true, data }
  } catch (err) {
    console.error("Error fetching exam:", err)
    return { success: false, error: err instanceof Error ? err.message : "Failed to fetch exam" }
  }
}

// ─── Get Exam Results ──────────────────────────────────────────────────────────

export const getExamResults = async (examId: number) => {
  try {
    const { data, error } = await supabase
      .from("exam_results")
      .select("*")
      .eq("exam_id", examId)
      .order("created_at", { ascending: false })

    if (error) throw error
    return { success: true, data }
  } catch (err) {
    console.error("Error fetching exam results:", err)
    return { success: false, error: err instanceof Error ? err.message : "Failed to fetch exam results" }
  }
}

// ─── Get Scanned Papers ────────────────────────────────────────────────────────

export const getScannedPapers = async (examId: number) => {
  try {
    const { data, error } = await supabase
      .from("scanned_papers")
      .select("*")
      .eq("exam_id", examId)
      .order("scanned_at", { ascending: false })

    if (error) throw error
    return { success: true, data }
  } catch (err) {
    console.error("Error fetching scanned papers:", err)
    return { success: false, error: err instanceof Error ? err.message : "Failed to fetch scanned papers" }
  }
}

// ─── Update Student Exam Feedback ──────────────────────────────────────────────

export const updateStudentFeedback = async (
  examId: number,
  studentId: string,
  feedback: string
) => {
  try {
    const { data, error } = await supabase
      .from("exam_results")
      .update({
        feedback,
        updated_at: new Date().toISOString(),
      })
      .eq("exam_id", examId)
      .eq("student_id", studentId)
      .select()
      .single()

    if (error) throw error
    return { success: true, data }
  } catch (err) {
    console.error("Error updating student feedback:", err)
    return { success: false, error: err instanceof Error ? err.message : "Failed to update feedback" }
  }
}

// ─── Delete Scanned Paper ──────────────────────────────────────────────────────

export const deleteScannedPaper = async (paperId: number) => {
  try {
    const { error } = await supabase
      .from("scanned_papers")
      .delete()
      .eq("id", paperId)

    if (error) throw error
    return { success: true }
  } catch (err) {
    console.error("Error deleting scanned paper:", err)
    return { success: false, error: err instanceof Error ? err.message : "Failed to delete scanned paper" }
  }
}

// ─── Bulk Update Exam Results Status ───────────────────────────────────────────

export const bulkUpdateResultsStatus = async (
  examId: number,
  resultIds: number[],
  status: string
) => {
  try {
    const { data, error } = await supabase
      .from("scanned_papers")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .in("id", resultIds)
      .eq("exam_id", examId)
      .select()

    if (error) throw error
    return { success: true, data }
  } catch (err) {
    console.error("Error updating results status:", err)
    return { success: false, error: err instanceof Error ? err.message : "Failed to update results status" }
  }
}
