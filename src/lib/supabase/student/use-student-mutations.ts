// ── React Query Hooks for Student Mutations ────────────────────────────────────
// Provides mutation hooks for adding/removing students from courses/exams.

import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  addStudentToCourse,
  addStudentToExam,
  addStudentsToCourse,
  removeStudentFromCourse,
} from "./student-service"

// ── Add single student to course ───────────────────────────────────────────────

export const useAddStudentToCourse = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ studentId, courseId, examineeIdNumber }: {
      studentId: string
      courseId: string
      examineeIdNumber?: string
    }) => addStudentToCourse(studentId, courseId, examineeIdNumber),
    onSuccess: (_, variables) => {
      // Invalidate course students query
      queryClient.invalidateQueries({
        queryKey: ["courseStudents", variables.courseId],
      })
      // Invalidate all students query
      queryClient.invalidateQueries({
        queryKey: ["availableStudents"],
      })
    },
    onError: (error: unknown) => {
      console.error("Failed to add student to course:", error)
    },
  })
}

// ── Add single student to exam ─────────────────────────────────────────────────

export const useAddStudentToExam = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ studentId, examId }: {
      studentId: string
      examId: string
    }) => addStudentToExam(studentId, examId),
    onSuccess: (_, variables) => {
      // Invalidate exam students query
      queryClient.invalidateQueries({
        queryKey: ["examStudents", variables.examId],
      })
    },
    onError: (error: unknown) => {
      console.error("Failed to add student to exam:", error)
    },
  })
}

// ── Add multiple students to course ────────────────────────────────────────────

export const useAddStudentsToCourse = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ studentIds, courseId }: {
      studentIds: string[]
      courseId: string
    }) => addStudentsToCourse(studentIds, courseId),
    onSuccess: (_, variables) => {
      // Invalidate course students query
      queryClient.invalidateQueries({
        queryKey: ["courseStudents", variables.courseId],
      })
      // Invalidate all students query
      queryClient.invalidateQueries({
        queryKey: ["availableStudents"],
      })
    },
    onError: (error: unknown) => {
      console.error("Failed to add students to course:", error)
    },
  })
}

// ── Remove student from course ────────────────────────────────────────────────

export const useRemoveStudentFromCourse = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ studentId, courseId }: {
      studentId: string
      courseId: string
    }) => removeStudentFromCourse(studentId, courseId),
    onSuccess: (_, variables) => {
      // Invalidate course students query
      queryClient.invalidateQueries({
        queryKey: ["courseStudents", variables.courseId],
      })
      // Invalidate all students query
      queryClient.invalidateQueries({
        queryKey: ["availableStudents"],
      })
    },
    onError: (error: unknown) => {
      console.error("Failed to remove student from course:", error)
    },
  })
}
