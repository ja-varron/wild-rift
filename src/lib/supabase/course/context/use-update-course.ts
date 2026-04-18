import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../supabase";
import type { Course } from "@/model/course";

export const useUpdateCourse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ course_id, updates }: { course_id: string, updates: Partial<Course> }) => {
      const { data, error } = await supabase
        .from('courses')
        .update(updates)
        .eq('course_id', course_id)
        .select()
        .single();

      if (error) {
        console.error("Error updating course:", error);
        throw new Error(error.message);
      }
      return data;
    },
    onSuccess: (data) => {
      // Invalidate the cache to trigger a refetch of courses for this institution
      if (data && data.institution_id) {
        queryClient.invalidateQueries({ queryKey: ['courses', data.institution_id] });
      }
    }
  });
};
