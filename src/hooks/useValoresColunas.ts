import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { buscarTodos } from "@/lib/buscarTodos";
import { valoresUnicosColuna, type OpcaoColuna } from "@/lib/valoresColuna";

export interface FonteFiltros {
  tabela: "obra" | "prioritario" | "localidade" | "historico_os";
  chave: string;
  incluirVazios?: boolean;
}

/** Uma leitura paginada por tabela, independente da página e dos filtros ativos. */
export function useValoresColunas(fonte: FonteFiltros | undefined, campos: string[]) {
  const colunas = [...new Set(campos)].sort();
  return useQuery({
    queryKey: ["valores-colunas", fonte, colunas],
    enabled: !!fonte && colunas.length > 0,
    staleTime: 60 * 1000,
    queryFn: async (): Promise<Record<string, OpcaoColuna[]>> => {
      if (!fonte || colunas.length === 0) return {};
      const rows = await buscarTodos<Record<string, unknown>>((head) => head
        ? supabase.from(fonte.tabela).select(fonte.chave, { count: "exact", head: true })
        : supabase.from(fonte.tabela).select(colunas.join(",")).order(fonte.chave, { ascending: true }));
      return Object.fromEntries(colunas.map(campo => [campo,
        valoresUnicosColuna(rows.map(row => row[campo]), fonte.incluirVazios ?? true)]));
    },
  });
}