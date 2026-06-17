import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Operador {
  id: string;
  user_id: string;
  full_name: string | null;
  cargo: string | null;
}

export function useOperadores() {
  const { data, isLoading } = useQuery({
    queryKey: ["operadores"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('list_operadores');
      if (error) throw error;
      return (data ?? []).map((op: { user_id: string; full_name: string | null; cargo: string | null }) => ({
        id: op.user_id,
        user_id: op.user_id,
        full_name: op.full_name,
        cargo: op.cargo,
      })) as Operador[];
    },
  });

  return {
    operadores: data ?? [],
    isLoading,
  };
}
