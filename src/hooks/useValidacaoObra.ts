import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ObraValidacao {
  id_obra: number;
  num_obra: string | null;
  status: string | null;
  sigco: number | null;
  valor_orcado: number | null;
  valor_realizado: number | null;
  nome_lcd: string | null;
  tipo_atendimento: string | null;
  analise_obra: string | null;
  cadastro_enbpar: string | null;
  check_txt: string | boolean | null;
  data_analise: string | null;
  responsavel: string | null;
  ods?: string | null;
  status_ods?: string | null;
}

export interface TipoQuantitativo {
  id: string;
  nome: string;
  categoria: string | null;
  unidade: string | null;
}

export interface QuantitativoObra {
  id: string;
  obra_id: number;
  tipo_quantitativo_id: string;
  quantidade: number;
  tipo: TipoQuantitativo | null;
}

export function useObraDetalhe(idObra: number | null) {
  return useQuery({
    queryKey: ["obra-detalhe", idObra],
    enabled: idObra !== null,
    queryFn: async () => {
      const { data, error } = await supabase.from("obra").select("*").eq("id_obra", idObra).maybeSingle();
      if (error) throw error;
      return data as ObraValidacao | null;
    },
  });
}

export function useSalvarValidacaoObra(idObra: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dados: Partial<ObraValidacao>) => {
      const { error } = await supabase.from("obra").update(dados).eq("id_obra", idObra);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["obra-detalhe", idObra] }),
  });
}

export function useTiposQuantitativos() {
  return useQuery({
    queryKey: ["tipos-quantitativos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tipos_quantitativos").select("id,nome,categoria,unidade").order("nome");
      if (error) throw error;
      return (data ?? []) as TipoQuantitativo[];
    },
  });
}

export function useQuantitativosObra(idObra: number | null) {
  return useQuery({
    queryKey: ["quantitativos-obra", idObra],
    enabled: idObra !== null,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quantitativos_obras")
        .select("id,obra_id,tipo_quantitativo_id,quantidade,tipo:tipo_quantitativo_id(id,nome,categoria,unidade)")
        .eq("obra_id", idObra)
        .order("id");
      if (error) throw error;
      return (data ?? []) as unknown as QuantitativoObra[];
    },
  });
}

export function useSalvarQuantitativo(idObra: number) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (item: {
      id?: string;
      tipo_quantitativo_id: string;
      quantidade: number;
    }) => {
      const payload = {
        obra_id: idObra,
        tipo_quantitativo_id: item.tipo_quantitativo_id,
        quantidade: item.quantidade,
      };

      const { error } = item.id
        ? await supabase.from("quantitativos_obras").update(payload).eq("id", item.id)
        : await supabase.from("quantitativos_obras").insert(payload);

      if (error) throw error;
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["quantitativos-obra", idObra] }),
  });
}

export function useExcluirQuantitativo(idObra: number) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("quantitativos_obras")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["quantitativos-obra", idObra] }),
  });
}
