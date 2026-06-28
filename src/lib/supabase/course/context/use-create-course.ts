import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../supabase";
import type { Course } from "@/model/course";

export const useCreateCourse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newCourse: Omit<Course, 'course_id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('courses')
        .insert(newCourse)
        .select()
        .single();

      if (error) {
        console.error("Error creating course:", error);
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
