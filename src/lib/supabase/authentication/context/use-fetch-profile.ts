import { supabase } from "@/lib/supabase/supabase";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { UserProfile } from "@/model/user-profile";
import type { User as AuthUser } from "@supabase/supabase-js";
import { useEffect } from "react";

// Helper function to fetch the user profile from Supabase based on the authenticated user
const getProfile = async (user: AuthUser | null | undefined): Promise<UserProfile | null | undefined> => {
  // If there is no authenticated user, return null
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select(
      "user_id, first_name, middle_name, last_name, email, role, examinee_id_number, institution_id, course_enrollment (course_id, courses (course_name))"
    )
    .eq('user_id', user.id)
    .maybeSingle()

  

  // If there is no user profile, return null
  if (!data) {
    return null;
  }

  // If there is an error fetching the user profile, log it
  if (error) {
    console.error("Error fetching user profile:", error);
  }

  // Unpack array from Supabase if it's returning one-to-many
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const firstCourseItem: any = Array.isArray(data.course_enrollment) && data.course_enrollment.length > 0 
      ? data.course_enrollment[0] 
      : data.course_enrollment;

  // Map the data to a UserProfile object
  const userProfile: UserProfile = {
    user_id: data.user_id,
    first_name: data.first_name,
    middle_name: data.middle_name,
    last_name: data.last_name,
    email: data.email,
    role: data.role,
    institution_id: data.institution_id,
    examinee_id_number: data.examinee_id_number,
    course: firstCourseItem ? {
      course_id: firstCourseItem.course_id,
      course_name: firstCourseItem.courses?.course_name || null
    } : null
  }

  return userProfile
}

// Custom hook to fetch the authenticated user's profile using React Query
const useFetchProfile = () => {
  const queryClient = useQueryClient();

  // A query to get the Supabase auth user
  const { data: authUser, isLoading: isAuthUserLoading } = useQuery({
    queryKey: ['authUser'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.user ?? null;
    },
    // Don't refetch the auth user on window focus or at intervals, since Supabase handles session persistence and updates internally
    refetchOnWindowFocus: false,
    staleTime: Infinity // The auth user data is considered fresh indefinitely, as it will be updated via Supabase's onAuthStateChange listener
  })

  // A query to get the user profile, which depends on the auth user
  const { data: userProfile, isLoading: isUserProfileLoading } = useQuery({
    queryKey: ['userProfile', authUser?.id],
    queryFn: () => getProfile(authUser),
    enabled: !!authUser, // Only run this query if we have an auth user
    // We can set a reasonable stale time for the profile data, since it may change (e.g. if the user updates their profile)
    staleTime: 5 * 60 * 1000 // 5 minutes
  })

  // Set up a listener for auth state changes to invalidate the user profile query when the auth user changes (e.g. on sign-in or sign-out)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      // When the auth state changes, we want to invalidate the user profile query so it will refetch with the new auth user (or null if signed out)

      if (event === "SIGNED_IN" || event === "USER_UPDATED") {
        queryClient.invalidateQueries({ queryKey: ['authUser'] });
        queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      } else if (event === "SIGNED_OUT") {
        // Use setQueryData instead of removeQueries so the update is synchronous:
        // removeQueries deletes the cache entry and triggers an async refetch,
        // causing a brief loading state. setQueryData(null) immediately makes
        // authUser = null so the Router re-renders and redirects in the same cycle.
        queryClient.setQueryData(['authUser'], null);
        queryClient.removeQueries({ queryKey: ['userProfile'] });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient]);

  return {
    authUser,
    userProfile,
    isLoading: isAuthUserLoading || (!!authUser && isUserProfileLoading)
  }
}

export { useFetchProfile }
