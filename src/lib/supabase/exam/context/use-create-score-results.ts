import { useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "../../supabase"

type RawAnswerPayload = Record<string, string> | string[]

type ScoreTopicPayload = {
  topicId: number
  topicName: string
  score: number
  maxScore: number
  percent: number
}

type ScoreResultPayload = {
  totalScore: number
  totalItems: number
  scorePercent: number
  passed: boolean
  answerKeyVersion: string
  scannedAt: string
  topicScores: ScoreTopicPayload[]
}

type CreateScoreResultPayload = {
  examId: string
  examineeId: string
  answers?: RawAnswerPayload
  scorePayload: ScoreResultPayload
}

function normalizeAnswersPayload(payload: RawAnswerPayload): Record<string, string> {
  if (Array.isArray(payload)) {
    return payload.reduce<Record<string, string>>((acc, value, index) => {
      if (typeof value === "string" && value.trim()) {
        acc[String(index + 1)] = value.trim()
      }
      return acc
    }, {})
  }

  return Object.entries(payload).reduce<Record<string, string>>((acc, [key, value]) => {
    if (typeof value === "string" && value.trim()) {
      acc[key] = value.trim()
    }
    return acc
  }, {})
}

function isMissingConflictConstraintError(error: unknown): boolean {
  const message = String((error as { message?: string })?.message || "").toLowerCase()
  return message.includes("no unique") && message.includes("on conflict")
}

const useCreateScoreResults = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreateScoreResultPayload) => {
      const examineeId = payload.examineeId.trim()
      if (!examineeId) {
        throw new Error("Examinee ID is required.")
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("user_id, examinee_id_number")
        .eq("examinee_id_number", examineeId)
        .eq("role", "Student")
        .maybeSingle()

      if (profileError) {
        console.error("Error fetching profile:", profileError)
        throw new Error(profileError.message)
      }
      if (!profile) {
        throw new Error(`No student found for examinee ID ${examineeId}.`)
      }

      if (payload.answers) {
        const normalizedAnswers = normalizeAnswersPayload(payload.answers)
        if (Object.keys(normalizedAnswers).length > 0) {
          const { error: paperError } = await supabase
            .from("exam_papers")
            .insert({
              exam_id: payload.examId,
              student_id: profile.user_id,
              actual_answers: normalizedAnswers,
            })

          if (paperError) {
            console.error("Error saving exam paper:", paperError)
            throw new Error(paperError.message)
          }
        }
      }

      const parsedScan = Date.parse(payload.scorePayload.scannedAt)
      const scannedAt = Number.isFinite(parsedScan)
        ? new Date(parsedScan).toISOString()
        : new Date().toISOString()

      const scoreRow = {
        exam_id: payload.examId,
        student_id: profile.user_id,
        scores: { ...payload.scorePayload, scannedAt },
        scanned_at: scannedAt,
      }

      const upsertResult = await supabase
        .from("score_results")
        .upsert(scoreRow, { onConflict: "exam_id,student_id" })

      if (upsertResult.error) {
        if (isMissingConflictConstraintError(upsertResult.error)) {
          const { error: insertError } = await supabase
            .from("score_results")
            .insert(scoreRow)
          if (insertError) throw insertError
        } else {
          throw upsertResult.error
        }
      }

      return { exam_id: payload.examId, student_id: profile.user_id }
    },
    onSuccess: (_data, variables) => {
      if (variables.examId) {
        queryClient.invalidateQueries({ queryKey: ["scoreResults", variables.examId] })
      }
    },
  })
}

export { useCreateScoreResults }