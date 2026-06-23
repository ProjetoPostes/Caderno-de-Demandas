import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Obra, Localidade, Prioritario, historico_os } from "@/types/database";

export function useObras() {
  return useQuery({
    queryKey: ["obras"],
    queryFn: async (): Promise<Obra[]> => {
      const { data, error } = await supabase
        .from("obra")
        .select("*")
        .is("deleted_at", null)
        .order("num_obra", { ascending: true })
        .limit(5000);
      if (error) throw error;
      return (data ?? []) as Obra[];
    },
  });
}

export function useLocalidades() {
  return useQuery({
    queryKey: ["localidades"],
    queryFn: async (): Promise<Localidade[]> => {
      const { data, error } = await supabase
        .from("localidade")
        .select("*")
        .order("nome_lcd", { ascending: true })
        .limit(5000);
      if (error) throw error;
      return (data ?? []) as Localidade[];
    },
  });
}

export function usePrioritarios() {
  return useQuery({
    queryKey: ["prioritarios"],
    queryFn: async (): Promise<Prioritario[]> => {
      const { data, error } = await supabase
        .from("prioritario")
        .select("*")
        .order("nome", { ascending: true })
        .limit(5000);
      if (error) throw error;
      return (data ?? []) as Prioritario[];
    },
  });
}

export function useHistoricoOs(limit = 1000) {
  return useQuery({
    queryKey: ["historico-os", limit],
    queryFn: async (): Promise<historico_os[]> => {
      const { data, error } = await supabase
        .from("historico_os")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as historico_os[];
    },
  });
}
