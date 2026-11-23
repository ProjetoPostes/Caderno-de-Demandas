import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { buscarTodos } from "@/lib/buscarTodos";
import { valoresUnicosColuna, FILTRO_NULO, type OpcaoColuna } from "@/lib/valoresColuna";

export interface FonteFiltros {
  tabela: "obra" | "prioritario" | "localidade" | "historico_os";
  chave: string;
  incluirVazios?: boolean;
}

/** RPCs com SELECT DISTINCT no banco: evitam baixar a tabela inteira. */
const RPC_FILTROS: Partial<Record<FonteFiltros["tabela"], string>> = {
  obra: "get_filtros_obras",
  prioritario: "get_filtros_prioritarios",
};

export async function buscarFiltrosRpc(nome: string): Promise<Record<string, string[]>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)(nome);
  if (error) throw error;
  return (data ?? {}) as Record<string, string[]>;
}

export function useValoresColunas(fonte: FonteFiltros | undefined, campos: string[]) {
  const colunas = [...new Set(campos)].sort();
  return useQuery({
    queryKey: ["valores-colunas", fonte, colunas],
    enabled: !!fonte && colunas.length > 0,
    staleTime: 10 * 60 * 1000,
    queryFn: async (): Promise<Record<string, OpcaoColuna[]>> => {
      if (!fonte || colunas.length === 0) return {};
      const incluirVazios = fonte.incluirVazios ?? true;
      const resultado: Record<string, OpcaoColuna[]> = {};
      let restantes = colunas;
      const rpc = RPC_FILTROS[fonte.tabela];
      if (rpc) {
        const dados = await buscarFiltrosRpc(rpc);
        for (const campo of colunas) {
          if (!Array.isArray(dados[campo])) continue;
          const opcoes = valoresUnicosColuna(dados[campo], false);
          resultado[campo] = incluirVazios ? [{ value: FILTRO_NULO, label: "Não informado" }, ...opcoes] : opcoes;
        }
        restantes = colunas.filter(c => !resultado[c]);
      }
      if (restantes.length) {
        const rows = await buscarTodos<Record<string, unknown>>((head) => head
          ? supabase.from(fonte.tabela).select(fonte.chave, { count: "exact", head: true })
          : supabase.from(fonte.tabela).select(restantes.join(",")).order(fonte.chave, { ascending: true }));
        for (const campo of restantes) resultado[campo] = valoresUnicosColuna(rows.map(row => row[campo]), incluirVazios);
      }
      return resultado;
    },
  });
}
