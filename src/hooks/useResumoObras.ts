import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { buscarTodos } from "@/lib/buscarTodos";
import {
  obrasFiltradasParaResumo, parametrosObras, somarResumoObras,
  type FiltrosResumoObras, type ObraResumoFonte,
} from "@/lib/resumoObras";

export function useResumoObras(params: FiltrosResumoObras) {
  return useQuery({
    queryKey: ["obras", "resumo", params],
    staleTime: 60_000,
    queryFn: async () => {
      // Caminho rápido: agregação direta no banco.
      const { tranche, ...outros } = params.filters ?? {};
      const rapido = await supabase.rpc("get_resumo_obras", {
        p_tranche: tranche?.trim() || null,
        p_search: params.search?.trim() || null,
        p_filters: outros,
      });
      if (!rapido.error && rapido.data) {
        const r = (Array.isArray(rapido.data) ? rapido.data[0] : rapido.data) as Record<string, unknown> | undefined;
        if (r) {
          const n = (v: unknown) => Number(v) || 0;
          return {
            numeroObras: n(r.numero_obras ?? r.total_obras ?? r.total ?? r.count),
            valorOrcado: n(r.valor_orcado ?? r.total_orcado),
            valorRealizado: n(r.valor_realizado ?? r.total_realizado),
          };
        }
      }
      const obras = await obrasFiltradasParaResumo(async (page, pageSize) => {
        const { data, error } = await supabase.rpc("get_obras_filtradas", parametrosObras(params, page, pageSize, "id_obra"));
        if (error) throw error;
        const resultado = data as { rows: ObraResumoFonte[]; total: number } | null;
        return { rows: resultado?.rows ?? [], total: resultado?.total ?? 0 };
      });

      // Algumas versões da RPC retornam apenas as colunas da listagem.
      // Completa os valores com leituras da obra, sem mudar a seleção feita pela RPC.
      const incompletas = obras.filter(obra => obra.valor_orcado === undefined || obra.valor_realizado === undefined);
      const valores = new Map<number, ObraResumoFonte>();
      for (let offset = 0; offset < incompletas.length; offset += 200) {
        const ids = incompletas.slice(offset, offset + 200).map(obra => obra.id_obra);
        const linhas = await buscarTodos<ObraResumoFonte>((head) => supabase.from("obra")
          .select("id_obra,valor_orcado,valor_realizado", { count: "exact", head })
          .in("id_obra", ids).order("id_obra"));
        for (const linha of linhas) valores.set(linha.id_obra, linha);
      }
      return somarResumoObras(obras.map(obra => {
        if (obra.valor_orcado !== undefined && obra.valor_realizado !== undefined) return obra;
        const valor = valores.get(obra.id_obra);
        if (!valor) throw new Error("Não foi possível consultar os valores de todas as obras filtradas.");
        return valor;
      }));
    },
  });
}