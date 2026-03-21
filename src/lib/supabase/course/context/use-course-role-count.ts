import { useQueryClient, useQuery } from "@tanstack/react-query"
import supabase from "../../supabase"
import { useEffect } from "react"

export type CourseRoleCount = {
  students: number,
  instructors: number,
}

const countUserByCourseRole = async (courseId: string) : Promise<CourseRoleCount> => {
  const { data, error } = await supabase
    .from('user_course')
    .select(`
      profiles(
        role
      ) 
    `)
    .eq('course_id', courseId)

  if (error) {
    console.error("Error fetching user count:", error)
    return { students: 0, instructors: 0 }
  }

  let students = 0
  let instructors = 0

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?.forEach((row: any) => {
    if (row.profiles?.role === 'student') {
      students++
    } else if (row.profiles?.role === 'instructor') {
      instructors++
    }
  })

  return { students, instructors }
}

export const useCourseRoleCount = (courseId: string) => {
  const queryClient = useQueryClient()

  const { data: roleCount, isLoading } = useQuery({
    queryKey: ['courseRoleCount', courseId],
    queryFn: () => countUserByCourseRole(courseId),
    staleTime: 5 * 60 * 1000 // 5 minutes
  })

  useEffect(() => {
    const channel = supabase
      .channel(`course-${courseId}-user-changes`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_course', filter: `course_id=eq.${courseId}` },
        (payload) => {
          console.log('User-course change received!', payload)
          queryClient.invalidateQueries({ queryKey: ['courseRoleCount', courseId] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient, courseId])

  return { roleCount: roleCount ?? { students: 0, instructors: 0 }, isLoading }
}