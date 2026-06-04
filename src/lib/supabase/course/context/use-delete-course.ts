import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../supabase";

export const useDeleteCourse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ course_id, institution_id }: { course_id: string, institution_id: string }) => {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('course_id', course_id);

      if (error) {
        console.error("Error deleting course:", error);
        throw new Error(error.message);
      }
      
      // Return the institution_id so onSuccess knows what to invalidate
      return { institution_id }; 
    },
    onSuccess: (data) => {
      // Invalidate the cache to trigger a refetch of courses for this institution
      if (data && data.institution_id) {
        queryClient.invalidateQueries({ queryKey: ['courses', data.institution_id] });
      }
    }
  });
};
