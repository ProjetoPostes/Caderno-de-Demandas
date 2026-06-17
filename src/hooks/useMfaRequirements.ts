import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type AppRole = "admin" | "operador_chefe" | "operador" | "consultor";

export interface MfaRequirement {
  id: string;
  role: AppRole;
  required: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserMfaRequirement {
  requires_mfa: boolean;
  user_roles?: string[];
  required_roles?: string[];
  reason?: string;
}

export function useMfaRequirements() {
  const queryClient = useQueryClient();

  const { data: requirements = [], isLoading, error } = useQuery({
    queryKey: ["mfa-requirements"],
    queryFn: async (): Promise<MfaRequirement[]> => {
      const { data, error } = await supabase
        .from("mfa_requirements")
        .select("*")
        .order("role");

      if (error) throw error;
      return data as MfaRequirement[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ role, required }: { role: AppRole; required: boolean }) => {
      const { error } = await supabase
        .from("mfa_requirements")
        .update({ required })
        .eq("role", role);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mfa-requirements"] });
      toast.success("Configuração de 2FA atualizada");
    },
    onError: (error: any) => {
      toast.error("Erro ao atualizar configuração", {
        description: error.message,
      });
    },
  });

  const checkUserMfaRequirement = async (userId: string): Promise<UserMfaRequirement | null> => {
    const { data, error } = await supabase.rpc("check_user_mfa_requirement", {
      p_user_id: userId,
    });

    if (error) {
      console.error("Error checking MFA requirement:", error);
      return null;
    }

    return data as unknown as UserMfaRequirement;
  };

  return {
    requirements,
    isLoading,
    error,
    updateRequirement: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    checkUserMfaRequirement,
  };
}
