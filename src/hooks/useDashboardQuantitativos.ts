import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { normalizarLinha, type QuantitativoDashboard } from "@/lib/dashboardObras";

export function useDashboardQuantitativos(tranche: string | null) {
  return useQuery({
    queryKey: ["dashboard-quantitativos", tranche],
    queryFn: async (): Promise<QuantitativoDashboard[]> => {
      const { data, error } = await (supabase as any).rpc("get_dashboard_quantitativos", {
        p_tranche: tranche || null,
      });
      if (error) throw error;
      const arr = Array.isArray(data) ? data : [];
      return arr.map((r: Record<string, unknown>) => normalizarLinha(r));
    },
  });
}
