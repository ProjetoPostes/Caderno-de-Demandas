import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type {
  AnaliseOsRow,
  CriterioEnquadramentoRow,
  Json,
} from "@/integrations/supabase/schema";

export interface OsResumo {
  id_os: string;
  num_os: number;
  datasol: string | null;
  tranche: string | null;
  status: string | null;
  num_obra: string | null;
  cpf: string | null;
  nome: string | null;
  dt_nasc: string | null;
  nome_lcd: string | null;
  municipio: string | null;
  codigo_ibge_municipio: string | null;
  uf: string | null;
  regional: string | null;
}

interface CadernoJoined {
  id_os: string;
  num_os: number;
  datasol: string | null;
  tranche: string | null;
  status: string | null;
  obra: { num_obra: string | null } | null;
  cliente: { cpf: string | null; nome: string | null; dt_nasc: string | null } | null;
  localidade: {
    nome_lcd: string | null;
    municipio: string | null;
    codigo_ibge_municipio: string | null;
    uf: string | null;
    regional: string | null;
  } | null;
}

export function useOsResumo(idOs: string | undefined) {
  return useQuery({
    queryKey: ["analise-os-resumo", idOs],
    enabled: !!idOs,
    queryFn: async (): Promise<OsResumo> => {
      const { data, error } = await supabase
        .from("caderno")
        .select(
          "id_os, num_os, datasol, tranche, status, obra:id_obra(num_obra), cliente:id_cliente(cpf, nome, dt_nasc), localidade:id_loc(nome_lcd, municipio, codigo_ibge_municipio, uf, regional)",
        )
        .eq("id_os", idOs as string)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("OS não encontrada");
      const row = data as unknown as CadernoJoined;
      return {
        id_os: row.id_os,
        num_os: row.num_os,
        datasol: row.datasol,
        tranche: row.tranche,
        status: row.status,
        num_obra: row.obra?.num_obra ?? null,
        cpf: row.cliente?.cpf ?? null,
        nome: row.cliente?.nome ?? null,
        dt_nasc: row.cliente?.dt_nasc ?? null,
        nome_lcd: row.localidade?.nome_lcd ?? null,
        municipio: row.localidade?.municipio ?? null,
        codigo_ibge_municipio: row.localidade?.codigo_ibge_municipio ?? null,
        uf: row.localidade?.uf ?? null,
        regional: row.localidade?.regional ?? null,
      };
    },
  });
}

export function useAnaliseAtual(idOs: string | undefined) {
  return useQuery({
    queryKey: ["analise-os", idOs],
    enabled: !!idOs,
    queryFn: async (): Promise<AnaliseOsRow | null> => {
      const { data, error } = await supabase
        .from("analise_os")
        .select("*")
        .eq("id_os", idOs as string)
        .eq("analise_atual", true)
        .is("deleted_at", null)
        .maybeSingle();
      if (error) throw error;
      return (data as AnaliseOsRow | null) ?? null;
    },
  });
}

export function useCriteriosEnquadramento() {
  return useQuery({
    queryKey: ["criterios-enquadramento"],
    queryFn: async (): Promise<CriterioEnquadramentoRow[]> => {
      const { data, error } = await supabase
        .from("criterios_enquadramento")
        .select("*")
        .eq("ativo", true)
        .order("categoria", { ascending: true })
        .order("ordem", { ascending: true });
      if (error) throw error;
      return (data as CriterioEnquadramentoRow[]) ?? [];
    },
  });
}

export function useCriteriosDaAnalise(idAnalise: string | undefined) {
  return useQuery({
    queryKey: ["analise-criterios", idAnalise],
    enabled: !!idAnalise,
    queryFn: async (): Promise<number[]> => {
      const { data, error } = await supabase
        .from("analise_criterios")
        .select("id_criterio")
        .eq("id_analise", idAnalise as string);
      if (error) throw error;
      return ((data as { id_criterio: number }[]) ?? []).map((r) => r.id_criterio);
    },
  });
}

export function useAnalistas() {
  return useQuery({
    queryKey: ["analistas-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, username")
        .order("full_name", { ascending: true });
      if (error) throw error;
      return (data as { user_id: string; full_name: string | null; username: string | null }[]) ?? [];
    },
  });
}

export interface SalvarAnaliseArgs {
  idOs: string;
  dados: Record<string, Json>;
  criterios: number[];
  concluir: boolean;
}

export function useSalvarAnalise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ idOs, dados, criterios, concluir }: SalvarAnaliseArgs) => {
      const { data, error } = await supabase.rpc("salvar_analise_os", {
        p_id_os: idOs,
        p_dados: dados as Json,
        p_criterios: criterios,
        p_concluir: concluir,
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["analise-os", vars.idOs] });
      queryClient.invalidateQueries({ queryKey: ["analise-criterios"] });
    },
  });
}
