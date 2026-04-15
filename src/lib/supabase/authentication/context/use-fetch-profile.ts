import supabase from "@/lib/supabase/supabase";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { UserProfile } from "@/model/user-profile";
import type { User as AuthUser } from "@supabase/supabase-js";
import { useEffect } from "react";

// Helper function to fetch the user profile from Supabase based on the authenticated user
const getProfile = async (user: AuthUser | null | undefined): Promise<UserProfile | null | undefined> => {
  if (!user) return null;

  const email = user.email ?? "";
  const emailNamePart = email.split("@")[0] ?? "";
  const normalizedName = emailNamePart.replace(/[._-]+/g, " ").trim();
  const fallbackFirstName = user.user_metadata?.first_name ?? normalizedName.split(" ")[0] ?? "User";
  const derivedLastName = normalizedName.split(" ").slice(1).join(" ");
  const fallbackLastName = (user.user_metadata?.last_name ?? derivedLastName) || "Member";

  const buildFallbackProfile = () => new UserProfile({
    user_id: user.id,
    first_name: fallbackFirstName,
    middle_name: null,
    last_name: fallbackLastName,
    email,
    role: "Student",
  });


  const { data: profileData, error } = await supabase
    .from('profiles')
    .select(
      'first_name, middle_name, last_name, email, role'
    )
    .eq('user_id', user.id)
    .maybeSingle();

  
  if (error) {
    console.error("Error fetching user profile:", error);
    throw new Error(error.message);
  }

  if (!profileData) {
    return buildFallbackProfile();
  }

  return profileData ? new UserProfile({
    user_id: user.id,
    first_name: profileData.first_name,
    middle_name: profileData.middle_name,
    last_name: profileData.last_name,
    email: profileData.email,
    role: profileData.role,
  }) : buildFallbackProfile();
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      // When the auth state changes, we want to invalidate the user profile query so it will refetch with the new auth user (or null if signed out)
      queryClient.invalidateQueries({ queryKey: ['authUser'] });
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient]);

  return {
    authUser,
    userProfile,
    isLoading: isAuthUserLoading || isUserProfileLoading
  }
}

export { useFetchProfile }
