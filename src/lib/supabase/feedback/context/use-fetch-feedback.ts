import { useEffect, useMemo } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import type { Feedback } from "@/pages/instructor/exams/types"
import { supabase } from "../../supabase"

const fetchFeedback = async (
  exam_id: string,
  student_id?: string,
): Promise<Feedback[]> => {

  let query = supabase
    .from("feedbacks")
    .select(
      "feedback_id, exam_id, student_id, comment, message_at, profiles!inner(user_id, first_name, last_name)",
    )
    .eq("exam_id", exam_id)

  if (student_id) {
    query = query.eq("student_id", student_id)
  }

  const { data, error } = await query

  if (error) {
    console.error("Error fetching feedback:", error)
    throw new Error(error.message)
  }

  const feedbacks: Feedback[] = (data ?? []).map((item) => {
    const profile = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles
    const studentId = profile?.user_id ?? item.student_id

    return {
      feedback_id: item.feedback_id,
      exam_id: item.exam_id,
      student: {
        student_id: studentId,
        first_name: profile?.first_name,
        last_name: profile?.last_name
      }, 
      comment: item.comment,
      message_at: item.message_at
    }
  })

  return feedbacks
}

const useFetchFeedback = (exam_id: string, student_id?: string) => {
  const queryClient = useQueryClient()
  const queryKey = useMemo(
    () => (student_id ? ["feedback", exam_id, student_id] : ["feedback", exam_id]),
    [exam_id, student_id],
  )

  const { data: feedbackEntries, isLoading, refetch } = useQuery({
    queryKey,
    queryFn: () => fetchFeedback(exam_id, student_id),
    enabled: !!exam_id,
    staleTime: 5 * 60 * 1000,
  })

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "USER_UPDATED") {
        queryClient.invalidateQueries({ queryKey })
      } else if (event === "SIGNED_OUT") {
        queryClient.removeQueries({ queryKey })
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [queryClient, exam_id, student_id, queryKey])

  return { feedbackEntries: feedbackEntries ?? [], isLoading, refetch }
}

export { useFetchFeedback }