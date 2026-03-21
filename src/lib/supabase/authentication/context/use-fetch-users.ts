import { UserProfile } from "@/model/user-profile";
import { supabase } from "../../supabase";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

const fetchUsers = async () : Promise<UserProfile[]> => {
  const { data, error } = await supabase.from('profiles').select('*').neq('role', 'Admin').range(0, 20).order('last_name', { ascending: true });

  if (error) {
    console.error("Error fetching users:", error);
    throw new Error(error.message);
  }

  const users: UserProfile[] = [];

  data.forEach((user) => {
    users.push(new UserProfile({
      user_id: user.user_id,
      first_name: user.first_name,
      middle_name: user.middle_name,
      last_name: user.last_name,
      email: user.email,
      role: user.role,
      dateCreated: user.created_at,
    }));
  });

  return users;
}


export const useFetchUsers = () => {
  const queryClient = useQueryClient();

  // A query to get all users
  const { data: users, isLoading } = useQuery({
    queryKey: ['profiles'],
    queryFn: fetchUsers,
    // We can set a reasonable stale time for the users data, since it may change (e.g. if an admin creates a new account)
    staleTime: 5 * 60 * 1000 // 5 minutes
  })

  useEffect(() => {
    const channel = supabase
      .channel('profiles-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        (payload) => {
          console.log('Change received!', payload);
          queryClient.invalidateQueries({ queryKey: ['profiles'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return { users: users ?? [], isLoading };
}
