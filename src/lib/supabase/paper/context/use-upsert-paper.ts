import { supabase } from "../../supabase"
import { useMutation, useQueryClient } from "@tanstack/react-query"

export const useUpsertExamPaper = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ exam_id, student_id, actual_answers }: { exam_id: string; student_id: string; actual_answers: Record<string, string> }) => {
      const { error } = await supabase
        .from("exam_papers")
        .upsert({ exam_id, student_id, actual_answers })
        .eq("exam_id", exam_id)
        .eq("student_id", student_id)
        .maybeSingle()

      if (error) {
        console.error("Error upserting exam paper:", error)
        throw new Error(error.message)
      }
    },
    onSuccess: (_, { exam_id, student_id }) => {
      // Invalidate the cache for this specific exam paper to trigger a refetch
      queryClient.invalidateQueries({ queryKey: ['exam_papers', exam_id, student_id] })
    }
  })
}