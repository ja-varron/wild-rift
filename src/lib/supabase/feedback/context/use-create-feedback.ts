import { useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "../../supabase";

type FeedbackInsert = {
  exam_id: string
  student_id: string
  comment: string
  message_at: string
}

const useCreateFeedback = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (newFeedback: FeedbackInsert) => {
      const { data, error } = await supabase        
        .from("feedbacks")
        .insert(newFeedback)
        .select()
        .single()

      if (error) {
        console.error("Error creating feedback:", error)
        throw new Error(error.message)
      }

      return data
    },
    onSuccess: (data) => {
      if (data?.exam_id && data?.student_id) {
        queryClient.invalidateQueries({ queryKey: ["feedback", data.exam_id] })
        queryClient.invalidateQueries({ queryKey: ["feedback", data.exam_id, data.student_id] })
      }
    },
  });
}

export { useCreateFeedback }