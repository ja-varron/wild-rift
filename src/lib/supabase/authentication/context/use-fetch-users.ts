import type { UserProfile } from "@/model/user-profile";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import supabase from "@/lib/supabase/supabase";
import { useEffect } from "react";

// Helper function to fetch all users in an institution
const fetchUsers = async (institution_id: string) : Promise<UserProfile[]> => {
  if (!institution_id) {
    throw new Error("Institution ID is required to fetch users")
  }

  // Fetch all users in an institution
  const { data, error } = await supabase
    .from('profiles')
    .select(
      "user_id, first_name, middle_name, last_name, email, role, examinee_id_number, institution_id"
    )
    .eq('institution_id', institution_id)
    .in('role', ['Student', 'Instructor'])
    .order('created_at', { ascending: true })
    .limit(20)
    
  if (error) {
    console.error("Error fetching users:", error);
    throw new Error(error.message);
  }

  const userProfile: UserProfile[] = (data || []).map((user: any) => {
    return {
      user_id: user.user_id,
      first_name: user.first_name,
      middle_name: user.middle_name,
      last_name: user.last_name,
      email: user.email,
      role: user.role,
      institution_id: user.institution_id,
      examinee_id_number: user.examinee_id_number,
    }
  })

  return userProfile;
}

// Custom hook to fetch all users in an institution
const useFetchUsers = (institution_id: string) => {
  const queryClient = useQueryClient()

  // A query to get all users
  const { data: users, isLoading, refetch } = useQuery({
    queryKey: ['profiles', institution_id],
    queryFn: () => fetchUsers(institution_id),
    // We can set a reasonable stale time for the users data, since it may change (e.g. if an admin creates a new account)
    staleTime: 5 * 60 * 1000 // 5 minutes
  })

  // Set up a listener for auth state changes to invalidate the user profile query when the auth user changes (e.g. on sign-in or sign-out)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "USER_UPDATED") {
        // Only invalidate (refetch) when a user explicitly signs in or updates their user record
        queryClient.invalidateQueries({ queryKey: ['profiles', institution_id] });
      } 
      
      else if (event === "SIGNED_OUT") {
        // Completely remove the cached profiles from memory for security
        queryClient.removeQueries({ queryKey: ['profiles', institution_id] });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient, institution_id]);

  return { users: users ?? [], isLoading, refetch };
}

export { useFetchUsers }
