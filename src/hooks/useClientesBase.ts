import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ClienteOsCaderno {
  numos: number;
  numobra: string | null;
  status: string | null;
  controle_os: string | null;
}

export interface ClienteOsDespacho {
  numos: number;
  tratativa: string | null;
  dias_para_despacho: number | null;
}

export interface Cliente {
  cpf: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  regional: string | null;
  inBase5311: boolean;
  qtdOsCaderno: number;
  qtdOsDespacho: number;
  osCaderno: ClienteOsCaderno[];
  osDespacho: ClienteOsDespacho[];
}

export interface ClientesRpcParams {
  search?: string;
  regional?: string;
  page?: number;
  pageSize?: number;
  sortField?: "nome" | "cpf" | "os_pendentes";
  sortDir?: "asc" | "desc";
}

interface ClienteRpcRow {
  cpf: string | null;
  nome: string | null;
  email: string | null;
  telefone: string | null;
  regional: string | null;
  in_base_5311: boolean | null;
  qtd_os_caderno: number | null;
  qtd_os_despacho: number | null;
  os_caderno: ClienteOsCaderno[] | null;
  os_despacho: ClienteOsDespacho[] | null;
}

interface ClientesRpcResult {
  rows: ClienteRpcRow[];
  total: number;
}

const mapRow = (r: ClienteRpcRow): Cliente => ({
  cpf: r.cpf ?? "",
  nome: r.nome ?? "Sem nome",
  email: r.email,
  telefone: r.telefone,
  regional: r.regional,
  inBase5311: r.in_base_5311 ?? false,
  qtdOsCaderno: r.qtd_os_caderno ?? 0,
  qtdOsDespacho: r.qtd_os_despacho ?? 0,
  osCaderno: r.os_caderno ?? [],
  osDespacho: r.os_despacho ?? [],
});

/** Lista clientes via RPC get_clientes_rpc (busca, filtro, ordenação e paginação no servidor). */
export function useClientesRpc(params: ClientesRpcParams) {
  const { search = "", regional = "", page = 1, pageSize = 20, sortField = "nome", sortDir = "asc" } = params;

  return useQuery({
    queryKey: ["clientes-rpc", search, regional, page, pageSize, sortField, sortDir],
    placeholderData: (prev) => prev,
    queryFn: async (): Promise<{ rows: Cliente[]; total: number }> => {
      const { data, error } = await supabase.rpc("get_clientes_rpc", {
        p_search: search || null,
        p_regional: regional || null,
        p_page: page,
        p_page_size: pageSize,
        p_sort_field: sortField,
        p_sort_dir: sortDir,
      });
      if (error) throw error;
      const result = (data ?? { rows: [], total: 0 }) as unknown as ClientesRpcResult;
      return { rows: (result.rows ?? []).map(mapRow), total: result.total ?? 0 };
    },
  });
}

/** Regionais distintas (caderno + despacho) para o filtro da tela. */
export function useRegionaisClientes() {
  return useQuery({
    queryKey: ["regionais-clientes"],
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase.rpc("get_regionais_clientes");
      if (error) throw error;
      return ((data ?? []) as Array<{ regional: string }>).map((r) => r.regional).filter(Boolean);
    },
  });
}
