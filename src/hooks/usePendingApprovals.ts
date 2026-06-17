import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "./useUserRole";

export function usePendingApprovals() {
  const { isAdmin } = useUserRole();

  const { data: pendingCount = 0, isLoading } = useQuery({
    queryKey: ["pending-approvals-count"],
    queryFn: async () => {
      // Get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id");

      if (profilesError) throw profilesError;

      // Get all user roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id");

      if (rolesError) throw rolesError;

      // Find users without roles
      const usersWithRoles = new Set(roles.map(r => r.user_id));
      const pendingUsers = profiles.filter(p => !usersWithRoles.has(p.user_id));

      return pendingUsers.length;
    },
    enabled: isAdmin,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  return { pendingCount, isLoading };
}
