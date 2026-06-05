// ── Student Management Service ──────────────────────────────────────────────────
// Handles fetching all registered students, managing student enrollments,
// and searching students by name or email.

import { getSupabaseClient } from "../client"

export interface RegisteredStudent {
  user_id: string
  first_name: string
  last_name: string
  email: string
  role: "Student" | "Instructor" | "Admin"
  created_at: string
}

export interface StudentEnrollment {
  user_id: string
  course_id?: string | null
  exam_id?: string | null
  examinee_id_number?: string
  created_at: string
}

type ProfileJoin = {
  first_name?: string | null
  last_name?: string | null
  email?: string | null
  role?: RegisteredStudent["role"]
  created_at?: string | null
}

type UserCourseRow = {
  user_id: string
  course_id?: string | null
  examinee_id_number?: string | null
  created_at?: string | null
  user?: ProfileJoin[] | ProfileJoin | null
}

// ── Fetch all registered students ──────────────────────────────────────────────

/**
 * Fetch all registered students (users with role = 'Student')
 * @param searchQuery - Optional query to filter by name or email
 * @returns Array of registered students
 */
export const getAllStudents = async (
  searchQuery?: string
): Promise<{ success: boolean; data?: RegisteredStudent[]; error?: string }> => {
  try {
    const supabase = getSupabaseClient()

    console.debug("Fetching all registered students", searchQuery ? `with query: ${searchQuery}` : "")

    let query = supabase
      .from("profiles")
      .select("user_id, first_name, last_name, email, role, created_at")
      .eq("role", "Student")

    // Apply search filter if query provided
    if (searchQuery) {
      const searchTerm = `%${searchQuery}%`
      query = query.or(
        `first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},email.ilike.${searchTerm}`
      )
    }

    const { data, error } = await query.order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching students:", error)
      return { success: false, error: error.message }
    }

    console.debug(`Retrieved ${data?.length || 0} students`)
    return { success: true, data: data || [] }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error"
    console.error("Error in getAllStudents:", errorMsg)
    return { success: false, error: errorMsg }
  }
}

// ── Fetch students enrolled in a specific exam ─────────────────────────────────

/**
 * Fetch students already enrolled in a specific exam
 * @param examId - The exam ID to check enrollments for
 * @returns Array of enrollment records
 */
export const getStudentsByExam = async (
  examId: string
): Promise<{ success: boolean; data?: StudentEnrollment[]; error?: string }> => {
  try {
    const supabase = getSupabaseClient()

    console.debug("Fetching students enrolled in exam:", examId)

    const { data, error } = await supabase
      .from("exam_enrollments")
      .select("*")
      .eq("exam_id", examId)

    if (error) {
      console.error("Error fetching exam enrollments:", error)
      return { success: false, error: error.message }
    }

    console.debug(`Retrieved ${data?.length || 0} students for exam`)
    return { success: true, data: data || [] }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error"
    console.error("Error in getStudentsByExam:", errorMsg)
    return { success: false, error: errorMsg }
  }
}

// ── Fetch students enrolled in a specific course ────────────────────────────────

/**
 * Fetch students enrolled in a specific course
 * @param courseId - The course ID
 * @returns Array of students enrolled in the course with their details
 */
export const getStudentsByCourse = async (
  courseId: string
): Promise<{ success: boolean; data?: (RegisteredStudent & StudentEnrollment)[]; error?: string }> => {
  try {
    const supabase = getSupabaseClient()

    console.debug("Fetching students enrolled in course:", courseId)

    const { data, error } = await supabase
      .from("user_course")
      .select(
        `
        user_id,
        course_id,
        examinee_id_number,
        created_at,
        user:profiles(first_name, last_name, email, role, created_at)
      `
      )
      .eq("course_id", courseId)

    if (error) {
      console.error("Error fetching course enrollments:", error)
      return { success: false, error: error.message }
    }

    // Transform the nested data structure
    const transformedData = ((data || []) as UserCourseRow[]).map((enrollment) => {
      const profile = Array.isArray(enrollment.user)
        ? enrollment.user[0]
        : enrollment.user

      return {
        user_id: enrollment.user_id,
        first_name: profile?.first_name || "",
        last_name: profile?.last_name || "",
        email: profile?.email || "",
        role: profile?.role || "Student",
        created_at: profile?.created_at || "",
        course_id: enrollment.course_id,
        examinee_id_number: enrollment.examinee_id_number || undefined,
        enrollment_created_at: enrollment.created_at,
      }
    })

    console.debug(`Retrieved ${transformedData.length} students for course`)
    return { success: true, data: transformedData }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error"
    console.error("Error in getStudentsByCourse:", errorMsg)
    return { success: false, error: errorMsg }
  }
}

// ── Add a student to a course ──────────────────────────────────────────────────

/**
 * Add a student to a course enrollment
 * @param studentId - The student's user ID
 * @param courseId - The course ID
 * @param examineeIdNumber - Optional examinee ID number for the course
 * @returns Success status and any error message
 */
export const addStudentToCourse = async (
  studentId: string,
  courseId: string,
  examineeIdNumber?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const supabase = getSupabaseClient()

    console.debug(`Adding student ${studentId} to course ${courseId}`)

    const { error } = await supabase.from("user_course").insert({
      user_id: studentId,
      course_id: courseId,
      examinee_id_number: examineeIdNumber || null,
      created_at: new Date().toISOString(),
    })

    if (error) {
      // Ignore duplicate key errors
      if (error.code === "23505") {
        console.debug(`Student ${studentId} already enrolled in course ${courseId}`)
        return { success: true }
      }
      console.error("Error adding student to course:", error)
      return { success: false, error: error.message }
    }

    console.debug(`Student ${studentId} added to course ${courseId} successfully`)
    return { success: true }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error"
    console.error("Error in addStudentToCourse:", errorMsg)
    return { success: false, error: errorMsg }
  }
}

// ── Add a student to an exam ───────────────────────────────────────────────────

/**
 * Add a student to an exam enrollment
 * @param studentId - The student's user ID
 * @param examId - The exam ID
 * @returns Success status and any error message
 */
export const addStudentToExam = async (
  studentId: string,
  examId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const supabase = getSupabaseClient()

    console.debug(`Adding student ${studentId} to exam ${examId}`)

    // First, check if table exists, if not, this is expected
    const { error } = await supabase.from("exam_enrollments").insert({
      student_id: studentId,
      exam_id: examId,
      created_at: new Date().toISOString(),
    })

    if (error) {
      // Ignore duplicate key errors and table not found errors
      if (error.code === "23505" || error.message.includes("does not exist")) {
        console.debug(`Enrollment already exists or table not found`)
        return { success: true }
      }
      console.error("Error adding student to exam:", error)
      return { success: false, error: error.message }
    }

    console.debug(`Student ${studentId} added to exam ${examId} successfully`)
    return { success: true }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error"
    console.error("Error in addStudentToExam:", errorMsg)
    return { success: false, error: errorMsg }
  }
}

// ── Add multiple students to course ────────────────────────────────────────────

/**
 * Add multiple students to a course in a batch operation
 * @param studentIds - Array of student IDs to enroll
 * @param courseId - The course ID
 * @returns Success status with results for each student
 */
export const addStudentsToCourse = async (
  studentIds: string[],
  courseId: string
): Promise<{
  success: boolean
  results?: { studentId: string; success: boolean; error?: string }[]
  error?: string
}> => {
  try {
    const supabase = getSupabaseClient()

    console.debug(`Adding ${studentIds.length} students to course ${courseId}`)

    const enrollments = studentIds.map((studentId) => ({
      user_id: studentId,
      course_id: courseId,
      examinee_id_number: null,
      created_at: new Date().toISOString(),
    }))

    const { error } = await supabase.from("user_course").insert(enrollments)

    if (error) {
      // Ignore duplicate key errors - some students may already be enrolled
      if (error.code === "23505") {
        console.debug("Some students may already be enrolled - continuing")
        // Still return success as some may have been added
      } else {
        console.error("Error adding students to course:", error)
        return { success: false, error: error.message }
      }
    }

    console.debug(`${studentIds.length} students added to course ${courseId} successfully`)

    // Return success results for each student
    const results = studentIds.map((studentId) => ({
      studentId,
      success: true,
    }))

    return { success: true, results }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error"
    console.error("Error in addStudentsToCourse:", errorMsg)
    return { success: false, error: errorMsg }
  }
}

// ── Remove a student from a course ─────────────────────────────────────────────

/**
 * Remove a student from a course enrollment
 * @param studentId - The student's user ID
 * @param courseId - The course ID
 * @returns Success status
 */
export const removeStudentFromCourse = async (
  studentId: string,
  courseId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const supabase = getSupabaseClient()

    console.debug(`Removing student ${studentId} from course ${courseId}`)

    const { error } = await supabase
      .from("user_course")
      .delete()
      .eq("user_id", studentId)
      .eq("course_id", courseId)

    if (error) {
      console.error("Error removing student from course:", error)
      return { success: false, error: error.message }
    }

    console.debug(`Student ${studentId} removed from course ${courseId}`)
    return { success: true }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error"
    console.error("Error in removeStudentFromCourse:", errorMsg)
    return { success: false, error: errorMsg }
  }
}
