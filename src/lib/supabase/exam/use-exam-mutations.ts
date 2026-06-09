import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  createExam,
  updateExam,
  deleteExam,
  updateExamStatus,
  saveAnswerKey,
  saveExamResults,
  saveScannedPaper,
  getExamById,
  getExamResults,
  getScannedPapers,
  updateStudentFeedback,
  deleteScannedPaper,
  bulkUpdateResultsStatus,
} from "./exam-service"
import type { ExamTopic, AnswerKeyItem, StudentResult, ScannedPaper } from "@/pages/instructor/exams/types"

// ─── Create Exam Mutation ──────────────────────────────────────────────────────

export const useCreateExam = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      instructorId,
      examData,
    }: {
      instructorId: string
      examData: {
        title: string
        course: string
        location?: string
        examDate: string
        totalItems: number
        passingRate: number
        topics: string[]
      }
    }) => createExam(instructorId, examData),
    onSuccess: () => {
      // Invalidate instructor exams list to refetch
      queryClient.invalidateQueries({ queryKey: ["instructorExams"] })
    },
  })
}

// ─── Update Exam Mutation ──────────────────────────────────────────────────────

export const useUpdateExam = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      examId,
      examData,
    }: {
      examId: number
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
    }) => updateExam(examId, examData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instructorExams"] })
    },
  })
}

// ─── Delete Exam Mutation ──────────────────────────────────────────────────────

export const useDeleteExam = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (examId: number) => deleteExam(examId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instructorExams"] })
    },
  })
}

// ─── Update Exam Status Mutation ───────────────────────────────────────────────

export const useUpdateExamStatus = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      examId,
      status,
    }: {
      examId: number
      status: "Draft" | "Active" | "Completed"
    }) => updateExamStatus(examId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instructorExams"] })
    },
  })
}

// ─── Save Answer Key Mutation ──────────────────────────────────────────────────

export const useSaveAnswerKey = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      examId,
      answerKey,
    }: {
      examId: number
      answerKey: AnswerKeyItem[]
    }) => saveAnswerKey(examId, answerKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exam-details"] })
    },
  })
}

// ─── Save Exam Results Mutation ────────────────────────────────────────────────

export const useSaveExamResults = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      examId,
      studentResults,
    }: {
      examId: number
      studentResults: StudentResult[]
    }) => saveExamResults(examId, studentResults),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exam-results"] })
    },
  })
}

// ─── Save Scanned Paper Mutation ───────────────────────────────────────────────

export const useSaveScannedPaper = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      examId,
      scannedPaper,
    }: {
      examId: number
      scannedPaper: ScannedPaper
    }) => saveScannedPaper(examId, scannedPaper),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scanned-papers"] })
    },
  })
}

// ─── Get Exam by ID Query ──────────────────────────────────────────────────────

export const useGetExamById = (examId: number | null) => {
  return useQuery({
    queryKey: ["exam-details", examId],
    queryFn: () => (examId ? getExamById(examId) : Promise.resolve(null)),
    enabled: !!examId,
  })
}

// ─── Get Exam Results Query ────────────────────────────────────────────────────

export const useGetExamResults = (examId: number | null) => {
  return useQuery({
    queryKey: ["exam-results", examId],
    queryFn: () => (examId ? getExamResults(examId) : Promise.resolve({ success: true, data: [] })),
    enabled: !!examId,
  })
}

// ─── Get Scanned Papers Query ──────────────────────────────────────────────────

export const useGetScannedPapers = (examId: number | null) => {
  return useQuery({
    queryKey: ["scanned-papers", examId],
    queryFn: () => (examId ? getScannedPapers(examId) : Promise.resolve({ success: true, data: [] })),
    enabled: !!examId,
  })
}

// ─── Update Student Feedback Mutation ──────────────────────────────────────────

export const useUpdateStudentFeedback = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      examId,
      studentId,
      feedback,
    }: {
      examId: number
      studentId: string
      feedback: string
    }) => updateStudentFeedback(examId, studentId, feedback),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exam-results"] })
    },
  })
}

// ─── Delete Scanned Paper Mutation ────────────────────────────────────────────

export const useDeleteScannedPaper = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (paperId: number) => deleteScannedPaper(paperId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scanned-papers"] })
    },
  })
}

// ─── Bulk Update Results Status Mutation ───────────────────────────────────────

export const useBulkUpdateResultsStatus = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      examId,
      resultIds,
      status,
    }: {
      examId: number
      resultIds: number[]
      status: string
    }) => bulkUpdateResultsStatus(examId, resultIds, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scanned-papers"] })
    },
  })
}
