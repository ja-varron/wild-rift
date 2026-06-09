// ── Auto-Enrollment Service ────────────────────────────────────────────────────
// Handles automatic student enrollment in exams based on instructor-student relationships

import { getSupabaseClient } from "../client"

/**
 * Auto-enroll all students under an instructor into a newly created exam
 * Called automatically when an instructor creates an exam
 * @param examId - The newly created exam ID
 * @param instructorId - The instructor who created the exam
 * @returns Success status
 */
export const autoEnrollInstructorStudents = async (
  examId: string | number,
  instructorId: string
): Promise<{ success: boolean; enrolledCount: number; error?: string }> => {
  try {
    const supabase = getSupabaseClient()

    console.debug(`Auto-enrolling students for exam ${examId} from instructor ${instructorId}`)

    // 1. Get instructor PRC exam type
    const { data: instructorProfile, error: instructorProfileError } = await supabase
      .from("profiles")
      .select("prc_exam_type")
      .eq("user_id", instructorId)
      .maybeSingle()

    if (instructorProfileError) {
      const errorText = [
        instructorProfileError.message,
        (instructorProfileError as { details?: string }).details,
        (instructorProfileError as { hint?: string }).hint,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()

      const missingPrcExamTypeColumn =
        instructorProfileError.code === "42703" || errorText.includes("prc_exam_type")

      if (!missingPrcExamTypeColumn) {
        console.error("Error fetching instructor profile:", instructorProfileError)
        return { success: false, enrolledCount: 0, error: instructorProfileError.message }
      }

      // Fallback for environments where prc_exam_type migration is not yet applied.
      const { data: instructorStudents, error: studentsError } = await supabase
        .from("instructor_students")
        .select("student_id")
        .eq("instructor_id", instructorId)

      if (studentsError) {
        console.error("Error fetching instructor students:", studentsError)
        return { success: false, enrolledCount: 0, error: studentsError.message }
      }

      const fallbackStudentIds = (instructorStudents || []).map((is) => is.student_id)
      if (fallbackStudentIds.length === 0) {
        return { success: true, enrolledCount: 0 }
      }

      const { data: studentProfiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, first_name, last_name, email")
        .in("user_id", fallbackStudentIds)

      if (profilesError && !profilesError.message.includes("No rows")) {
        console.error("Error fetching student profiles:", profilesError)
      }

      const enrollments = (studentProfiles || []).map((student) => ({
        exam_id: parseInt(String(examId)),
        student_id: student.user_id,
        student_name: `${student.first_name} ${student.last_name}`,
        score: null,
        total_items: null,
        passed: false,
        topic_scores: null,
        feedback: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }))

      if (enrollments.length > 0) {
        const { error: enrollError } = await supabase
          .from("exam_results")
          .insert(enrollments, { defaultToNull: true })

        if (enrollError && !enrollError.message.includes("duplicate")) {
          console.error("Error auto-enrolling students:", enrollError)
          return { success: false, enrolledCount: 0, error: enrollError.message }
        }
      }

      return { success: true, enrolledCount: enrollments.length }
    }

    const prcExamType = instructorProfile?.prc_exam_type
    if (!prcExamType) {
      console.debug("No PRC exam type set for instructor, skipping auto-enrollment")
      return { success: true, enrolledCount: 0 }
    }

    // 2. Get all students with the same PRC exam type
    const { data: matchingStudents, error: studentsError } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("role", "Student")
      .eq("prc_exam_type", prcExamType)

    if (studentsError) {
      console.error("Error fetching students by PRC exam type:", studentsError)
      return { success: false, enrolledCount: 0, error: studentsError.message }
    }

    if (!matchingStudents || matchingStudents.length === 0) {
      console.debug("No students found for instructor PRC exam type, skipping auto-enrollment")
      return { success: true, enrolledCount: 0 }
    }

    const studentIds = matchingStudents.map((student) => student.user_id)

    const { data: studentProfiles, error: profilesError } = await supabase
      .from("profiles")
      .select("user_id, first_name, last_name, email")
      .in("user_id", studentIds)

    if (profilesError && !profilesError.message.includes("No rows")) {
      console.error("Error fetching student profiles:", profilesError)
      // Continue anyway with partial data
    }

    // 3. Create enrollment records in exam_results
    // These are placeholder enrollments before exams are taken
    const enrollments = (studentProfiles || []).map((student) => ({
      exam_id: parseInt(String(examId)),
      student_id: student.user_id,
      student_name: `${student.first_name} ${student.last_name}`,
      score: null,
      total_items: null,
      passed: false,
      topic_scores: null,
      feedback: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }))

    if (enrollments.length > 0) {
      const { error: enrollError } = await supabase
        .from("exam_results")
        .insert(enrollments, { defaultToNull: true })

      // Ignore duplicate errors - students may already be enrolled
      if (enrollError && !enrollError.message.includes("duplicate")) {
        console.error("Error auto-enrolling students:", enrollError)
        return { success: false, enrolledCount: 0, error: enrollError.message }
      }
    }

    console.debug(`Auto-enrolled ${enrollments.length} students in exam ${examId}`)
    return { success: true, enrolledCount: enrollments.length }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error"
    console.error("Error in autoEnrollInstructorStudents:", errorMsg)
    return { success: false, enrolledCount: 0, error: errorMsg }
  }
}

/**
 * Get all students assigned to an instructor
 * @param instructorId - The instructor ID
 * @returns Array of student profiles with basic info
 */
export const getInstructorStudents = async (
  instructorId: string
): Promise<{
  success: boolean
  data?: Array<{ user_id: string; first_name: string; last_name: string; email: string }>
  error?: string
}> => {
  try {
    const supabase = getSupabaseClient()

    console.debug("Fetching students for instructor:", instructorId)

    const { data: instructorStudents, error: linkError } = await supabase
      .from("instructor_students")
      .select("student_id")
      .eq("instructor_id", instructorId)

    if (linkError) {
      console.error("Error fetching instructor-student links:", linkError)
      return { success: false, error: linkError.message }
    }

    if (!instructorStudents || instructorStudents.length === 0) {
      return { success: true, data: [] }
    }

    const studentIds = instructorStudents.map((is) => is.student_id)

    const { data: studentProfiles, error: profileError } = await supabase
      .from("profiles")
      .select("user_id, first_name, last_name, email")
      .in("user_id", studentIds)
      .order("first_name", { ascending: true })

    if (profileError) {
      console.error("Error fetching student profiles:", profileError)
      return { success: false, error: profileError.message }
    }

    console.debug(`Retrieved ${studentProfiles?.length || 0} students for instructor`)
    return { success: true, data: studentProfiles || [] }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error"
    console.error("Error in getInstructorStudents:", errorMsg)
    return { success: false, error: errorMsg }
  }
}

/**
 * Assign a student to an instructor (admin function)
 * @param studentId - The student's user ID
 * @param instructorId - The instructor's user ID
 * @returns Success status
 */
export const assignStudentToInstructor = async (
  studentId: string,
  instructorId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    console.debug(`Assigning student ${studentId} to instructor ${instructorId}`)

    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"
    const response = await fetch(`${backendUrl}/api/assignments/mappings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ studentId, instructorId, createdAt: new Date().toISOString() }),
    })

    const payload = await response.json()
    if (!response.ok) {
      const errorMessage = payload?.error || "Failed to assign student"
      console.error("Error assigning student:", errorMessage)
      return { success: false, error: errorMessage }
    }

    console.debug(`Student ${studentId} assigned to instructor ${instructorId}`)
    return { success: true }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error"
    console.error("Error in assignStudentToInstructor:", errorMsg)
    return { success: false, error: errorMsg }
  }
}

/**
 * Remove a student from an instructor
 * @param studentId - The student's user ID
 * @param instructorId - The instructor's user ID
 * @returns Success status
 */
export const removeStudentFromInstructor = async (
  studentId: string,
  instructorId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    console.debug(`Removing student ${studentId} from instructor ${instructorId}`)

    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"
    const response = await fetch(`${backendUrl}/api/assignments/mappings`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ studentId, instructorId }),
    })

    const payload = await response.json()
    if (!response.ok) {
      const errorMessage = payload?.error || "Failed to remove assignment"
      console.error("Error removing student:", errorMessage)
      return { success: false, error: errorMessage }
    }

    console.debug(`Student ${studentId} removed from instructor ${instructorId}`)
    return { success: true }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error"
    console.error("Error in removeStudentFromInstructor:", errorMsg)
    return { success: false, error: errorMsg }
  }
}

/**
 * Get the instructor(s) assigned to a student
 * @param studentId - The student's user ID
 * @returns Array of instructor profiles
 */
export const getStudentInstructors = async (
  studentId: string
): Promise<{
  success: boolean
  data?: Array<{ user_id: string; first_name: string; last_name: string; email: string }>
  error?: string
}> => {
  try {
    const supabase = getSupabaseClient()

    console.debug("Fetching instructors for student:", studentId)

    const { data: studentInstructors, error: linkError } = await supabase
      .from("instructor_students")
      .select("instructor_id")
      .eq("student_id", studentId)

    if (linkError) {
      console.error("Error fetching student-instructor links:", linkError)
      return { success: false, error: linkError.message }
    }

    if (!studentInstructors || studentInstructors.length === 0) {
      return { success: true, data: [] }
    }

    const instructorIds = studentInstructors.map((si) => si.instructor_id)

    const { data: instructorProfiles, error: profileError } = await supabase
      .from("profiles")
      .select("user_id, first_name, last_name, email")
      .in("user_id", instructorIds)
      .order("first_name", { ascending: true })

    if (profileError) {
      console.error("Error fetching instructor profiles:", profileError)
      return { success: false, error: profileError.message }
    }

    console.debug(`Retrieved ${instructorProfiles?.length || 0} instructors for student`)
    return { success: true, data: instructorProfiles || [] }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error"
    console.error("Error in getStudentInstructors:", errorMsg)
    return { success: false, error: errorMsg }
  }
}
