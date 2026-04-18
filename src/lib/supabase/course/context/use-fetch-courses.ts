import type { Course } from "@/model/course";
import { supabase } from "../../supabase";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

// Helper function to fetch all courses in an institution
const getCourses = async (institution_id: string) : Promise<Course[]> => {
  const { data, error } = await supabase.from('courses').select('*').eq('institution_id', institution_id);

  if (error) {
    console.error("Error fetching courses:", error);
    throw new Error(error.message);
  }

  const courses: Course[] = (data || []).map((course) => {
    return {
      course_id: course.course_id,
      institution_id: course.institution_id,
      course_name: course.course_name,
      course_description: course.course_description ?? "",
      created_at: course.created_at,
      updated_at: course.updated_at,
    }
  });

  return courses;
}

// TODO: Create a useCourse hook that fetches a single course by id, and use it in the CourseCard component to display the course name and description. This will allow us to fetch the course data only when we need it, instead of fetching all courses at once.
export const useFetchCourses = (institution_id: string) => {
  const queryClient = useQueryClient();

  const { data: courses, isLoading, refetch } = useQuery({
    queryKey: ['courses', institution_id],
    queryFn: () => getCourses(institution_id),
    staleTime: 5 * 60 * 1000 // 5 minutes
  })

  // Set up a listener to invalidate the courses query when data for this specific institution changes
  useEffect(() => {
    // A unique channel name avoids overlapping connections
    const channelName = `courses-changes-${institution_id}`;
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'courses',
          filter: `institution_id=eq.${institution_id}` // 1. Filter to prevent listening to irrelevant data
        },
        () => {
          // 2. Invalidate only the specific query key instead of all courses
          queryClient.invalidateQueries({ queryKey: ['courses', institution_id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, institution_id]); // 3. Ensure institution_id is in the dependency array

  return { courses: courses ?? [], isLoading, refetch };
}