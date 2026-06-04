import type { Exam } from "@/model/exam";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../supabase";

export const useCreateExam = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newExam: Omit<Exam, 'exam_id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('exams')
        .insert(newExam)
        .select()
        .single();

      if (error) {
        console.error("Error creating exam:", error);
        throw new Error(error.message);
      }
      return data;
    },
    onSuccess: (data) => {
      // Invalidate the cache to trigger a refetch of exams for this institution
      if (data && data.institution_id) {
        queryClient.invalidateQueries({ queryKey: ['exams', data.institution_id] });
      }
    }
  })
}