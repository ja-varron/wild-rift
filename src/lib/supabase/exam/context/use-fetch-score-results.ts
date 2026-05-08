import type { ScoreResult, TopicScore } from "@/pages/instructor/exams/types"
import { supabase } from "../../supabase"
import { useEffect } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"

type ScoreTopicPayload = {
  topicId?: number
  topicName?: string
  score?: number
  maxScore?: number
  total?: number
  percent?: number
  topic?: {
    topic_idx?: number
    name?: string
  }
}

type ScorePayload = {
  totalScore?: number
  totalItems?: number
  scorePercent?: number
  passed?: boolean
  answerKeyVersion?: string
  scannedAt?: string
  topicScores?: ScoreTopicPayload[]
}

function parseScorePayload(value: unknown): ScorePayload {
  if (!value) return {}
  if (Array.isArray(value)) return { topicScores: value as ScoreTopicPayload[] }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown
      if (Array.isArray(parsed)) {
        return { topicScores: parsed as ScoreTopicPayload[] }
      }
      return (parsed ?? {}) as ScorePayload
    } catch {
      return {}
    }
  }
  return value as ScorePayload
}

function normalizeTopicScores(raw: ScoreTopicPayload[] | undefined): TopicScore[] {
  if (!Array.isArray(raw)) return []

  return raw.map((entry, index) => {
    const topicIdx =
      (typeof entry.topic?.topic_idx === "number" && Number.isFinite(entry.topic.topic_idx)
        ? entry.topic.topic_idx
        : undefined) ??
      (typeof entry.topicId === "number" && Number.isFinite(entry.topicId)
        ? entry.topicId
        : index + 1)

    const name =
      (typeof entry.topic?.name === "string" && entry.topic.name.trim()) ||
      (typeof entry.topicName === "string" && entry.topicName.trim()) ||
      `Topic ${index + 1}`

    const score = Number.isFinite(Number(entry.score)) ? Number(entry.score) : 0
    const total = Number.isFinite(Number(entry.total))
      ? Number(entry.total)
      : Number.isFinite(Number(entry.maxScore))
        ? Number(entry.maxScore)
        : 0

    return {
      topic: {
        topic_idx: topicIdx,
        name,
      },
      score,
      total,
    }
  })
}

// This hook fetches the score results for a specific exam, including the topic-wise breakdown of scores for each student.
const getStudentScoreResults = async (exam_id: string) : Promise<ScoreResult[]> => {
  const { data, error } = await supabase
    .from('score_results')
    .select('exam_id, profiles!inner(user_id, first_name, last_name, examinee_id_number), scores, scanned_at')
    .eq('exam_id', exam_id)

  if (error) {
    console.error("Error fetching score results:", error)
    throw new Error(error.message)
  }

  const scoreResults: ScoreResult[] = (data ?? []).map((item) => {
    const profile = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles
    const payload = parseScorePayload(item.scores)
    const topicScores = normalizeTopicScores(payload.topicScores)

    return {
      exam_id: item.exam_id,
      student: {
        student_id: profile?.user_id,
        first_name: profile?.first_name,
        last_name: profile?.last_name,
        examinee_id_number: profile?.examinee_id_number,
      },
      topicScores,
      scanned_at: item.scanned_at || payload.scannedAt || "",
      totalScore: payload.totalScore,
      totalItems: payload.totalItems,
      passed: payload.passed,
      scorePercent: payload.scorePercent,
      answerKeyVersion: payload.answerKeyVersion,
    }
  })

  return scoreResults
}


const useFetchScoreResults = (examId: string) => {
  const queryClient = useQueryClient()

  const { data: scoreResults, isLoading, refetch } = useQuery({
    queryKey: ["scoreResults", examId],
    queryFn: () => getStudentScoreResults(examId),
    enabled: !!examId,
    staleTime: 5 * 60 * 1000, // Cache score results for 5 minutes
  })

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "USER_UPDATED") {
        // Only invalidate (refetch) when a user explicitly signs in or updates their user record
        queryClient.invalidateQueries({ queryKey: ['scoreResults', examId] });
      } 
      
      else if (event === "SIGNED_OUT") {
        // Optionally, you could clear the score results from the cache on sign-out for security reasons
        queryClient.removeQueries({ queryKey: ['scoreResults', examId] });
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [queryClient, examId])

  return { scoreResults, isLoading, refetch }
}

export { useFetchScoreResults }