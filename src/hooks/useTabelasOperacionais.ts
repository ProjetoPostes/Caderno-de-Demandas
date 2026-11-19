import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import type { Obra, Localidade, Prioritario, historico_os } from "@/types/database";
import type {
  ObraFormData,
  LocalidadeFormData,
  PrioritarioFormData,
} from "@/lib/schemas/operacionais";

export type SortDir = "asc" | "desc";
export interface ListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortField?: string;
  sortDir?: SortDir;
  filters?: Record<string, string | undefined>;
}

interface Paged<T> {
  rows: T[];
  total: number;
}

function applyFilters(
  q: ReturnType<typeof supabase.from> extends infer R ? any : any,
  filters?: Record<string, string | undefined>,
) {
  if (!filters) return q;
  for (const [k, v] of Object.entries(filters)) {
    if (v && v.trim()) q = q.ilike(k, `%${v.trim()}%`);
  }
  return q;
}

// ---------- OBRA ----------
export function useObras(params: ListParams = {}) {
  const { page = 1, pageSize = 20, search = "", sortField = "num_obra", sortDir = "asc", filters } = params;
  return useQuery({
    queryKey: ["obras", { page, pageSize, search, sortField, sortDir, filters }],
    queryFn: async (): Promise<Paged<Obra>> => {
      const { tranche, ...outrosFiltros } = filters ?? {};
      const { data, error } = await supabase.rpc("get_obras_filtradas", {
        p_tranche: tranche?.trim() || null,
        p_search: search.trim() || null,
        p_filters: outrosFiltros,
        p_page: page,
        p_page_size: pageSize,
        p_sort_field: sortField,
        p_sort_dir: sortDir,
      });
      if (error) throw error;
      const resultado = data as Paged<Obra> | null;
      return { rows: resultado?.rows ?? [], total: resultado?.total ?? 0 };
    },
  });
}

export function useObraMutations() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["obras"] });

  const create = useMutation({
    mutationFn: async (input: ObraFormData) => {
      const { data, error } = await supabase
        .from("obra")
        .insert({ num_obra: input.num_obra, status: input.status || null, sigco: input.sigco })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { invalidate(); toast.success("Obra criada"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: async ({ id_obra, ...input }: ObraFormData & { id_obra: number }) => {
      const { data, error } = await supabase
        .from("obra")
        .update({ num_obra: input.num_obra, status: input.status || null, sigco: input.sigco })
        .eq("id_obra", id_obra)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { invalidate(); toast.success("Obra atualizada"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id_obra: number) => {
      const { error } = await supabase
        .from("obra")
        .update({ deleted_at: new Date().toISOString(), deleted_by: user?.id ?? null })
        .eq("id_obra", id_obra);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success("Obra excluída"); },
    onError: (e: Error) => toast.error(e.message),
  });

  return { create, update, remove };
}

// ---------- LOCALIDADE ----------
export function useLocalidades(params: ListParams = {}) {
  const { page = 1, pageSize = 20, search = "", sortField = "nome_lcd", sortDir = "asc", filters } = params;
  return useQuery({
    queryKey: ["localidades", { page, pageSize, search, sortField, sortDir, filters }],
    queryFn: async (): Promise<Paged<Localidade>> => {
      let q = supabase.from("localidade").select("*", { count: "exact" });
      if (search.trim()) {
        const s = search.trim();
        q = q.or(`cod_lcd.ilike.%${s}%,nome_lcd.ilike.%${s}%,regional.ilike.%${s}%`);
      }
      q = applyFilters(q, filters);
      q = q.order(sortField, { ascending: sortDir === "asc" }).range((page - 1) * pageSize, page * pageSize - 1);
      const { data, error, count } = await q;
      if (error) throw error;
      return { rows: (data ?? []) as Localidade[], total: count ?? 0 };
    },
  });
}

export function useLocalidadeMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["localidades"] });

  const create = useMutation({
    mutationFn: async (input: LocalidadeFormData) => {
      const { data, error } = await supabase
        .from("localidade")
        .insert({ cod_lcd: input.cod_lcd, nome_lcd: input.nome_lcd, regional: input.regional || null })
        .select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { invalidate(); toast.success("Localidade criada"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: async ({ id_loc, ...input }: LocalidadeFormData & { id_loc: number }) => {
      const { data, error } = await supabase
        .from("localidade")
        .update({ cod_lcd: input.cod_lcd, nome_lcd: input.nome_lcd, regional: input.regional || null })
        .eq("id_loc", id_loc).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { invalidate(); toast.success("Localidade atualizada"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id_loc: number) => {
      const { error } = await supabase.from("localidade").delete().eq("id_loc", id_loc);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success("Localidade excluída"); },
    onError: (e: Error) => toast.error(e.message),
  });

  return { create, update, remove };
}

// ---------- TRANCHES (valores reais do caderno) ----------
export function useTranchesCaderno() {
  return useQuery({
    queryKey: ["tranches-caderno"],
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<string[]> => {
      const BLOCO = 1000;
      const set = new Set<string>();
      for (let inicio = 0; ; inicio += BLOCO) {
        const { data, error } = await supabase
          .from("caderno")
          .select("tranche")
          .is("deleted_at", null)
          .not("tranche", "is", null)
          .range(inicio, inicio + BLOCO - 1);
        if (error) throw error;
        (data ?? []).forEach((r: { tranche: string | null }) => { if (r.tranche) set.add(r.tranche); });
        if (!data || data.length < BLOCO) break;
      }
      return [...set].sort((a, b) => a.localeCompare(b, "pt-BR", { numeric: true }));
    },
  });
}

// ---------- PRIORITARIO ----------
function useValoresDistintosPrioritario(campo: "tranche" | "alocacao", chave: string) {
  return useQuery({
    queryKey: ["prioritario-valores", chave],
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<string[]> => {
      const BLOCO = 1000;
      const set = new Set<string>();
      for (let inicio = 0; ; inicio += BLOCO) {
        const { data, error } = await supabase
          .from("prioritario")
          .select(campo)
          .not(campo, "is", null)
          .order("id", { ascending: true })
          .range(inicio, inicio + BLOCO - 1);
        if (error) throw error;
        (data ?? []).forEach((r: Record<string, string | null>) => { const v = r[campo]; if (v) set.add(v); });
        if (!data || data.length < BLOCO) break;
      }
      return [...set].sort((a, b) => a.localeCompare(b, "pt-BR", { numeric: true }));
    },
  });
}

export function useTranchesPrioritario() {
  return useValoresDistintosPrioritario("tranche", "tranche");
}

export function useAlocacoesPrioritario() {
  return useValoresDistintosPrioritario("alocacao", "alocacao");
}

export function usePrioritarios(params: ListParams = {}) {
  const { page = 1, pageSize = 20, search = "", sortField = "nome", sortDir = "asc", filters } = params;
  return useQuery({
    queryKey: ["prioritarios", { page, pageSize, search, sortField, sortDir, filters }],
    queryFn: async (): Promise<Paged<Prioritario>> => {
      let q = supabase.from("prioritario").select("*", { count: "exact" });
      if (search.trim()) {
        const s = search.trim();
        q = q.or(`nome.ilike.%${s}%,cpf_corrigido.ilike.%${s}%,observacao.ilike.%${s}%`);
      }
      const { coordenada_validada: cv, nome_cliente_ligado: ncl, decisao, ...outros } = filters ?? {};
      if (cv === "Sim") q = q.eq("coordenada_validada", true);
      else if (cv === "Não") q = q.eq("coordenada_validada", false);
      else if (cv === "Não informado") q = q.is("coordenada_validada", null);
      if (ncl === "Preenchido") q = q.not("nome_cliente_ligado", "is", null).neq("nome_cliente_ligado", "");
      else if (ncl === "Vazio") q = q.or("nome_cliente_ligado.is.null,nome_cliente_ligado.eq.");
      if (decisao?.trim()) q = q.eq("decisao", decisao.trim());
      q = applyFilters(q, outros);
      q = q.order(sortField, { ascending: sortDir === "asc" }).range((page - 1) * pageSize, page * pageSize - 1);
      const { data, error, count } = await q;
      if (error) throw error;
      return { rows: (data ?? []) as Prioritario[], total: count ?? 0 };
    },
  });
}

export function usePrioritarioMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["prioritarios"] });

  const normalizeCpf = (v?: string) => (v ? v.replace(/\D/g, "") || null : null);

  const create = useMutation({
    mutationFn: async (input: PrioritarioFormData) => {
      const { data, error } = await supabase
        .from("prioritario")
        .insert({
          nome: input.nome,
          cpf_corrigido: normalizeCpf(input.cpf_corrigido),
          observacao: input.observacao || null,
          endereco: input.endereco || null,
        })
        .select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { invalidate(); toast.success("Prioritário criado"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...input }: PrioritarioFormData & { id: string }) => {
      const { data, error } = await supabase
        .from("prioritario")
        .update({
          nome: input.nome,
          cpf_corrigido: normalizeCpf(input.cpf_corrigido),
          observacao: input.observacao || null,
          endereco: input.endereco || null,
        })
        .eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { invalidate(); toast.success("Prioritário atualizado"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("prioritario").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success("Prioritário excluído"); },
    onError: (e: Error) => toast.error(e.message),
  });

  return { create, update, remove };
}

// ---------- OBRA: counts and OS list ----------
export function useObraOsCounts(idObras: number[]) {
  return useQuery({
    queryKey: ["obra-os-counts", idObras.slice().sort()],
    enabled: idObras.length > 0,
    queryFn: async (): Promise<Record<number, number>> => {
      const results = await Promise.all(
        idObras.map(async (id) => {
          const { count } = await supabase
            .from("caderno")
            .select("id_os", { count: "exact", head: true })
            .is("deleted_at", null)
            .eq("id_obra", id);
          return [id, count ?? 0] as const;
        }),
      );
      return Object.fromEntries(results);
    },
  });
}

export function useObraOsList(idObra: number | null) {
  return useQuery({
    queryKey: ["obra-os-list", idObra],
    enabled: idObra !== null,
    queryFn: async () => {
      if (idObra === null) return [];
      // Busca todas as OSs da obra em blocos (sem corte de quantidade)
      const BLOCO = 1000;
      const data: unknown[] = [];
      for (let inicio = 0; ; inicio += BLOCO) {
        const { data: parte, error } = await supabase
          .from("caderno")
          .select("id_os,num_os,status,controle_os,tranche,datasol,datatertrab,id_cliente,cliente:id_cliente(nome,cpf),localidade:id_loc(municipio,nome_lcd)")
          .is("deleted_at", null)
          .eq("id_obra", idObra)
          .order("num_os", { ascending: true })
          .range(inicio, inicio + BLOCO - 1);
        if (error) throw error;
        data.push(...(parte ?? []));
        if (!parte || parte.length < BLOCO) break;
      }
      const registros = (data ?? []) as unknown as Array<{
        id_os: string;
        num_os: number;
        status: string | null;
        controle_os: string | null;
        tranche: string | null;
        datasol: string | null;
        datatertrab: string | null;
        cliente: { nome: string | null; cpf: string | null } | null;
        localidade: { municipio: string | null; nome_lcd: string | null } | null;
      }>;

      if (registros.length === 0) return [];
      const { data: analises, error: analisesError } = await supabase
        .from("analise_os")
        .select("id_os,resultado_analise,num_padrao, num_kit")
        .in("id_os", registros.map((registro) => registro.id_os))
        .eq("analise_atual", true)
        .is("deleted_at", null);
      if (analisesError) throw analisesError;

      const mapaAnalises = new Map(
        ((analises ?? []) as Array<{
          id_os: string;
          resultado_analise: string | null;
          num_padrao: number | null;
          num_kit: number | null;
        }>).map((item) => [item.id_os, item]),
      );
      
      return registros.map((registro) => {
        const analise = mapaAnalises.get(registro.id_os);
      
        return {
          ...registro,
          resultado_analise: analise?.resultado_analise ?? null,
          num_padrao: Number(analise?.num_padrao) || 0,
          num_kit: Number(analise?.num_kit) || 0,
        };
      });
    },
  });
}

// ---------- OSs DO CLIENTE (prioritário) ----------
export function usePrioritarioOsList(idClienteInformado: number | null | undefined, cpf?: string | null) {
  return useQuery({
    queryKey: ["prioritario-os-list", idClienteInformado, cpf],
    enabled: idClienteInformado != null || !!cpf?.trim(),
    queryFn: async () => {
      let idCliente = idClienteInformado ?? null;
      if (idCliente == null && cpf?.trim()) {
        const d = cpf.replace(/\D/g, "");
        const fmt = d.length === 11 ? `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}` : d;
        const { data: cli, error: e } = await supabase
          .from("cliente").select("id_cliente").is("deleted_at", null)
          .in("cpf", Array.from(new Set([cpf.trim(), d, fmt]))).limit(1);
        if (e) throw e;
        idCliente = (cli?.[0] as { id_cliente: number } | undefined)?.id_cliente ?? null;
      }
      if (idCliente == null) return [];
      const BLOCO = 1000;
      const data: unknown[] = [];
      for (let inicio = 0; ; inicio += BLOCO) {
        const { data: parte, error } = await supabase
          .from("caderno")
          .select("id_os,num_os,status,controle_os,tranche,id_obra,obra:id_obra(num_obra)")
          .is("deleted_at", null)
          .eq("id_cliente", idCliente)
          .order("num_os", { ascending: true })
          .range(inicio, inicio + BLOCO - 1);
        if (error) throw error;
        data.push(...(parte ?? []));
        if (!parte || parte.length < BLOCO) break;
      }
      return data as Array<{
        id_os: string;
        num_os: number;
        status: string | null;
        controle_os: string | null;
        tranche: string | null;
        obra: { num_obra: number | null } | null;
      }>;
    },
  });
}

// ---------- HISTORICO OS (read-only) ----------
export function useHistoricoOs(params: ListParams = {}) {
  const { page = 1, pageSize = 25, search = "", sortField = "created_at", sortDir = "desc", filters } = params;
  return useQuery({
    queryKey: ["historico-os", { page, pageSize, search, sortField, sortDir, filters }],
    queryFn: async (): Promise<Paged<historico_os>> => {
      let q = supabase.from("historico_os").select("*", { count: "exact" });
      if (search.trim()) {
        const s = search.trim();
        const asNum = Number(s);
        if (Number.isFinite(asNum)) {
          q = q.or(`num_os.eq.${asNum},campo.ilike.%${s}%,valor_old.ilike.%${s}%,valor_new.ilike.%${s}%`);
        } else {
          q = q.or(`campo.ilike.%${s}%,valor_old.ilike.%${s}%,valor_new.ilike.%${s}%`);
        }
      }
      q = applyFilters(q, filters);
      q = q.order(sortField, { ascending: sortDir === "asc" }).range((page - 1) * pageSize, page * pageSize - 1);
      const { data, error, count } = await q;
      if (error) throw error;
      return { rows: (data ?? []) as historico_os[], total: count ?? 0 };
    },
  });
}

// ---------- MUNICÍPIOS (localidade.nome_lcd) ----------
export function useMunicipiosLocalidade() {
  return useQuery({
    queryKey: ["municipios-localidade"],
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const BLOCO = 1000;
      const nomes = new Set<string>();
      for (let inicio = 0; ; inicio += BLOCO) {
        const { data, error } = await supabase
          .from("localidade").select("nome_lcd").order("nome_lcd", { ascending: true })
          .range(inicio, inicio + BLOCO - 1);
        if (error) throw error;
        for (const r of (data ?? []) as Array<{ nome_lcd: string | null }>) if (r.nome_lcd?.trim()) nomes.add(r.nome_lcd.trim());
        if (!data || data.length < BLOCO) break;
      }
      return Array.from(nomes).sort((a, b) => a.localeCompare(b, "pt-BR"));
    },
  });
}
