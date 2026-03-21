import { Course } from "@/model/course";
import { supabase } from "../../supabase";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

const getCourses = async () : Promise<Course[]> => {
  const { data, error } = await supabase.from('courses').select('*').range(0, 19);

  if (error) {
    console.error("Error fetching courses:", error);
    throw new Error(error.message);
  }

  const courses: Course[] = [];

  data.forEach((course) => {
    courses.push(new Course({
      course_id: course.course_id,
      course_name: course.course_name,
      course_description: course.course_description,
      created_at: course.created_at,
    }));
  });

  return courses;
}

// TODO: Create a useCourse hook that fetches a single course by id, and use it in the CourseCard component to display the course name and description. This will allow us to fetch the course data only when we need it, instead of fetching all courses at once.
export const useFetchCourses = () => {
  const queryClient = useQueryClient();

  const { data: courses, isLoading, refetch } = useQuery({
    queryKey: ['courses'],
    queryFn: getCourses,
    staleTime: 5 * 60 * 1000 // 5 minutes
  })

  useEffect(() => {
    const channel = supabase
      .channel('courses-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'courses' },
        (payload) => {
          console.log('Change received!', payload);
          queryClient.invalidateQueries({ queryKey: ['courses'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return { courses: courses ?? [], isLoading, refetch };
}