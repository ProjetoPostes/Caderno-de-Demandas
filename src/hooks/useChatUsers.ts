import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ChatContact } from "@/types/chat";

export function useChatUsers() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["chat-users", user?.id],
    queryFn: async () => {
      // Get all users with any role
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("role", ["operador", "operador_chefe", "admin", "consultor"]);

      if (rolesError) throw rolesError;

      if (!roles || roles.length === 0) return [];

      // Get unique user IDs excluding current user
      const userIds = [...new Set(roles.map(r => r.user_id))].filter(
        id => id !== user?.id
      );

      if (userIds.length === 0) return [];

      // Get profiles for these users
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, user_id, full_name, avatar_url, cargo")
        .in("user_id", userIds);

      if (profilesError) throw profilesError;

      // Map profiles to ChatContact format with role info
      const contacts: ChatContact[] = (profiles || []).map(profile => {
        const userRole = roles.find(r => r.user_id === profile.user_id);
        return {
          id: profile.user_id,
          name: profile.full_name || "Usuário",
          type: 'user' as const,
          avatar_url: profile.avatar_url || undefined,
          role: userRole?.role || undefined,
        };
      });

      return contacts;
    },
    enabled: !!user,
  });

  return {
    users: data ?? [],
    isLoading,
  };
}
