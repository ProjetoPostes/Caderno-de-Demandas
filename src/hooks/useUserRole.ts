import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppRole } from "@/types/database";

export function useUserRole() {
  const { user } = useAuth();

  const { data: roles, isLoading } = useQuery({
    queryKey: ["user-roles", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      
      if (error) throw error;
      return data.map(r => r.role as AppRole);
    },
    enabled: !!user,
  });

  const hasRole = (role: AppRole) => roles?.includes(role) ?? false;
  const isAdmin = hasRole("admin");
  const isOperadorChefe = hasRole("operador_chefe");
  const isOperador = hasRole("operador");
  const isConsultor = hasRole("consultor");

  return {
    roles: roles ?? [],
    isLoading,
    hasRole,
    isAdmin,
    isOperadorChefe,
    isOperador,
    isConsultor,
    canManageDemandas: isAdmin || isOperadorChefe,
    canViewAllDemandas: isAdmin || isOperadorChefe,
    canViewCaderno: isAdmin || isOperadorChefe || isOperador || isConsultor,
    canEdit: isAdmin || isOperadorChefe || isOperador,
  };
}
