import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Base5311 } from "@/types/database";
import { toast } from "sonner";
import { mapDatabaseError } from "@/lib/errorHandler";

const TABLE = "base_5311" as const;

export function useBase5311() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["base_5311"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from(TABLE)
        .select("*")
        .order("controle", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return (data as Base5311[]) ?? [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (item: Partial<Base5311>) => {
      const { error } = await (supabase as any).from(TABLE).insert(item);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["base_5311"] });
      queryClient.invalidateQueries({ queryKey: ["caderno"] });
      queryClient.invalidateQueries({ queryKey: ["despacho"] });
      toast.success("Registro adicionado à Base 5311");
    },
    onError: (e) => toast.error(mapDatabaseError(e)),
  });

  const updateMutation = useMutation({
    mutationFn: async (item: Partial<Base5311> & { id: string }) => {
      const { id, ...rest } = item;
      const { error } = await (supabase as any).from(TABLE).update(rest).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["base_5311"] });
      queryClient.invalidateQueries({ queryKey: ["caderno"] });
      queryClient.invalidateQueries({ queryKey: ["despacho"] });
      toast.success("Registro atualizado");
    },
    onError: (e) => toast.error(mapDatabaseError(e)),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from(TABLE).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["base_5311"] });
      queryClient.invalidateQueries({ queryKey: ["caderno"] });
      queryClient.invalidateQueries({ queryKey: ["despacho"] });
      toast.success("Registro removido");
    },
    onError: (e) => toast.error(mapDatabaseError(e)),
  });

  const importMutation = useMutation({
    mutationFn: async (items: Record<string, unknown>[]) => {
      const norm = (v: unknown) => (v === undefined || v === null ? null : String(v).trim() || null);
      const pick = (item: Record<string, unknown>, keys: string[]) => {
        for (const k of keys) {
          if (item[k] !== undefined && item[k] !== null && String(item[k]).trim() !== "") return item[k];
        }
        return null;
      };
      const mapped = items.map((item) => ({
        controle: (() => {
          const v = pick(item, ["Controle", "controle", "CONTROLE"]);
          const n = v == null ? null : Number(v);
          return Number.isFinite(n) ? n : null;
        })(),
        identificacao: norm(pick(item, ["Identificação", "Identificacao", "identificacao", "IDENTIFICACAO"])),
        alocacao: norm(pick(item, ["Alocação", "Alocacao", "alocacao", "ALOCACAO"])),
        tranche: norm(pick(item, ["Tranche", "tranche", "TRANCHE"])),
        nome: norm(pick(item, ["Nome", "nome", "NOME"])),
        cpf: norm(pick(item, ["CPF", "cpf"])),
        cpf_corrigido: norm(pick(item, ["CPF corrigido", "CPF_CORRIGIDO", "cpf_corrigido", "CPF Corrigido"])),
        criterios: norm(pick(item, ["Critérios", "Criterios", "criterios", "CRITERIOS"])),
        endereco: norm(pick(item, ["Endereço", "Endereco", "endereco", "ENDERECO"])),
        municipio: norm(pick(item, ["Município", "Municipio", "municipio", "MUNICIPIO"])),
        polo: norm(pick(item, ["Polo", "polo", "POLO"])),
        regional: norm(pick(item, ["Regional", "regional", "REGIONAL"])),
        obra: norm(pick(item, ["Obra", "obra", "OBRA"])),
      }));
      for (let i = 0; i < mapped.length; i += 200) {
        const batch = mapped.slice(i, i + 200);
        const { error } = await (supabase as any).from(TABLE).insert(batch);
        if (error) throw error;
      }
      return mapped.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["base_5311"] });
      queryClient.invalidateQueries({ queryKey: ["caderno"] });
      queryClient.invalidateQueries({ queryKey: ["despacho"] });
      toast.success(`${count} registros importados para a Base 5311`);
    },
    onError: (e) => toast.error(mapDatabaseError(e)),
  });

  // Lookup helper (digits-only) — used for client-side flags
  const cpfSet = (data ?? []).reduce<Set<string>>((acc, b) => {
    const c = (b.cpf_corrigido ?? "").replace(/\D/g, "");
    if (c) acc.add(c);
    return acc;
  }, new Set());

  const isInBase5311 = (cpf?: string | null) => {
    if (!cpf) return false;
    const d = cpf.replace(/\D/g, "");
    return d.length > 0 && cpfSet.has(d);
  };

  return {
    data: data ?? [],
    isLoading,
    error,
    create: createMutation.mutate,
    update: updateMutation.mutate,
    remove: deleteMutation.mutate,
    importMany: importMutation.mutateAsync,
    isImporting: importMutation.isPending,
    isInBase5311,
  };
}