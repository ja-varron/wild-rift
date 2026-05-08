import type { Exam } from "@/model/exam";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../supabase";

export const useUpdateExam = () => {
  const queryClient = useQueryClient();

  return useMutation({
      mutationFn: async ({ exam_id, updates }: { exam_id: string, updates: Partial<Exam> }) => {
        const { data, error } = await supabase
          .from('exams')
          .update(updates)
          .eq('exam_id', exam_id)
          .select()
          .single();

        if (error) {
          console.error("Error updating exam:", error);
          throw new Error(error.message);
        }
        return data;
      },
      onSuccess: (data) => {
        // Invalidate the cache to trigger a refetch of exams for this course
        if (data && data.course_id) {
          queryClient.invalidateQueries({ queryKey: ['exams', data.course_id] });
        }
      }
  })
}