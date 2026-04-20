// ── React Query Hooks for Enrollment Management ─────────────────────────────────
// Provides hooks for managing student-instructor relationships

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  getInstructorStudents,
  getStudentInstructors,
  assignStudentToInstructor,
  removeStudentFromInstructor,
} from "./enrollment-service"

// ── Query: Get all students assigned to an instructor ─────────────────────────

export const useGetInstructorStudents = (instructorId?: string) => {
  return useQuery({
    queryKey: ["instructorStudents", instructorId],
    queryFn: () => {
      if (!instructorId) return Promise.resolve({ success: true, data: [] })
      return getInstructorStudents(instructorId)
    },
    enabled: !!instructorId,
    select: (data) => data.data || [],
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  })
}

// ── Query: Get all instructors assigned to a student ──────────────────────────

export const useGetStudentInstructors = (studentId?: string) => {
  return useQuery({
    queryKey: ["studentInstructors", studentId],
    queryFn: () => {
      if (!studentId) return Promise.resolve({ success: true, data: [] })
      return getStudentInstructors(studentId)
    },
    enabled: !!studentId,
    select: (data) => data.data || [],
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  })
}

// ── Mutation: Assign a student to an instructor ────────────────────────────────

export const useAssignStudentToInstructor = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ studentId, instructorId }: { studentId: string; instructorId: string }) => {
      const result = await assignStudentToInstructor(studentId, instructorId)
      if (!result.success) {
        throw new Error(result.error || "Failed to assign student")
      }
      return result
    },
    onSuccess: (_, { studentId, instructorId }) => {
      // Invalidate instructor students list
      queryClient.invalidateQueries({
        queryKey: ["instructorStudents", instructorId],
      })
      // Invalidate student instructors list
      queryClient.invalidateQueries({
        queryKey: ["studentInstructors", studentId],
      })
    },
    onError: (error: unknown) => {
      console.error("Failed to assign student:", error)
    },
  })
}

// ── Mutation: Remove a student from an instructor ────────────────────────────

export const useRemoveStudentFromInstructor = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ studentId, instructorId }: { studentId: string; instructorId: string }) => {
      const result = await removeStudentFromInstructor(studentId, instructorId)
      if (!result.success) {
        throw new Error(result.error || "Failed to remove student")
      }
      return result
    },
    onSuccess: (_, { studentId, instructorId }) => {
      // Invalidate instructor students list
      queryClient.invalidateQueries({
        queryKey: ["instructorStudents", instructorId],
      })
      // Invalidate student instructors list
      queryClient.invalidateQueries({
        queryKey: ["studentInstructors", studentId],
      })
    },
    onError: (error: unknown) => {
      console.error("Failed to remove student:", error)
    },
  })
}
