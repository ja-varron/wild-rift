import type { Exam } from "@/model/exam"
import { supabase } from "../../supabase"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"

const fetchExam = async (course_id: string): Promise<Exam[]> => {
  if (!course_id) {
    throw new Error("Course ID is required to fetch exams")
  }

  const { data, error } = await supabase
    .from('exams')
    .select(
      'exam_id, exam_title, exam_date, total_items, passing_rate, topics, created_at, courses!inner (course_id, course_name), profiles!inner (first_name, last_name)'
    )
    .eq('course_id', course_id)

  if (error) {
    console.error("Error fetching exams:", error)
    throw new Error("Failed to fetch exams")
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const exams: Exam[] = (data || []).map((exam: any) => {
    return {
      exam_id: exam.exam_id,
      course: exam.courses ? { course_id: exam.courses.course_id, course_name: exam.courses.course_name } : null,
      profile: Array.isArray(exam.profiles) ? exam.profiles[0] : exam.profiles,
      exam_title: exam.exam_title,
      exam_date: exam.exam_date,
      total_items: exam.total_items,
      passing_rate: exam.passing_rate,
      created_at: exam.created_at,
      created_by: exam.created_by,
      topics: exam.topics
    } as Exam
  })

  return exams
}

const useFetchExams = (course_id: string) => {
  const queryClient = useQueryClient()

  const { data: exams, isLoading, refetch } = useQuery({
    queryKey: ["exams", course_id],
    queryFn: () => fetchExam(course_id),
    enabled: !!course_id,
    staleTime: 5 * 60 * 1000, // Cache exams for 5 minutes
  })

  // Set up a listener for auth state changes to invalidate the user profile query when the auth user changes (e.g. on sign-in or sign-out)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "USER_UPDATED") {
        // Only invalidate (refetch) when a user explicitly signs in or updates their user record
        queryClient.invalidateQueries({ queryKey: ['exams', course_id] });
      } 
      
      else if (event === "SIGNED_OUT") {
        // Completely remove the cached exams from memory for security
        queryClient.removeQueries({ queryKey: ['exams', course_id] });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient, course_id]);

  return { exams: exams ?? [], isLoading, refetch };
}

export { useFetchExams }