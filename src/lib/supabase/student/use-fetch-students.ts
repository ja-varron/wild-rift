// ── React Query Hooks for Student Queries ──────────────────────────────────────
// Provides query hooks for fetching available students and course enrollments.

import { useQuery } from "@tanstack/react-query"
import {
  getAllStudents,
  getStudentsByCourse,
  getStudentsByExam,
} from "./student-service"

// ── Fetch all available students ───────────────────────────────────────────────

export const useFetchAvailableStudents = (searchQuery?: string) => {
  return useQuery({
    queryKey: ["availableStudents", searchQuery],
    queryFn: async () => {
      const result = await getAllStudents(searchQuery)
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch students")
      }
      return result.data || []
    },
    enabled: true,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes (previously cacheTime)
  })
}

// ── Fetch students in a course ────────────────────────────────────────────────

export const useFetchCourseStudents = (courseId?: string) => {
  return useQuery({
    queryKey: ["courseStudents", courseId],
    queryFn: async () => {
      if (!courseId) return []
      
      const result = await getStudentsByCourse(courseId)
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch course students")
      }
      return result.data || []
    },
    enabled: !!courseId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  })
}

// ── Fetch students in an exam ──────────────────────────────────────────────────

export const useFetchExamStudents = (examId?: string) => {
  return useQuery({
    queryKey: ["examStudents", examId],
    queryFn: async () => {
      if (!examId) return []
      
      const result = await getStudentsByExam(examId)
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch exam students")
      }
      return result.data || []
    },
    enabled: !!examId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  })
}

// ── Get newly added students (subscribes to realtime) ──────────────────────────

export const useFreshStudentData = (searchQuery?: string) => {
  // Force fresh data by disabling cache
  return useQuery({
    queryKey: ["availableStudents", searchQuery, "fresh"],
    queryFn: async () => {
      const result = await getAllStudents(searchQuery)
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch students")
      }
      return result.data || []
    },
    staleTime: 0, // Always consider stale
    gcTime: 0, // Don't cache
  })
}
