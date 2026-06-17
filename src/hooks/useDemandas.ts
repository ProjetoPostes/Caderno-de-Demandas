import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Demanda } from "@/types/database";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { mapDatabaseError } from "@/lib/errorHandler";
import { validateAccess, softDelete } from "./useSecurityRpc";

// Tipo para criação de demanda (exclui campos gerenciados automaticamente)
export type CreateDemandaInput = Omit<Demanda, "id" | "created_at" | "updated_at" | "criado_por" | "deleted_at" | "deleted_by">;

// Constantes
export const TIPOS_DEMANDA = ["Envio de carta", "Análise"];
export const TIPOS_CARTA = [
  "Futuro Pleito",
  "Sem casa",
  "Sem documento de posse",
  "Sem critério",
  "Orçamento",
  "Suspensão de Obra",
  "Retomada de Obra",
];

// Extrair números de OS da descrição
export const extractNumos = (descricao: string): number[] => {
  // Support markdown bold (**) around the label
  const match = descricao.match(/\*{0,2}OSs? para tratativa:\*{0,2}\s*([\d,\s]+)/i);
  if (match) {
    return match[1].split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n));
  }
  // Fallback: extract numbers that look like OS numbers (1-9 digits, standalone)
  const allNumbers = descricao.match(/\b\d{1,9}\b/g);
  if (allNumbers) {
    return allNumbers.map(n => parseInt(n)).filter(n => !isNaN(n));
  }
  return [];
};

export function useDemandas() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ["demandas"],
    queryFn: async () => {
      // Validate access before fetching
      const access = await validateAccess("demandas", "SELECT");
      if (!access.allowed) {
        throw new Error(access.reason);
      }

      const { data, error } = await supabase
        .from("demandas")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Demanda[];
    },
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async (demanda: CreateDemandaInput) => {
      const access = await validateAccess("demandas", "INSERT");
      if (!access.allowed) {
        throw new Error(access.reason);
      }

      const { error } = await supabase
        .from("demandas")
        .insert({ ...demanda, criado_por: user!.id });
      if (error) throw error;
      return demanda;
    },
    onSuccess: (_, demanda) => {
      queryClient.invalidateQueries({ queryKey: ["demandas"] });
      toast.success("Demanda criada", {
        description: `"${demanda.titulo}" foi adicionada ao sistema.`,
      });
    },
    onError: (error) => {
      toast.error("Erro ao criar demanda", {
        description: mapDatabaseError(error),
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (demanda: Partial<Demanda> & { id: string }) => {
      const access = await validateAccess("demandas", "UPDATE", demanda.id);
      if (!access.allowed) {
        throw new Error(access.reason);
      }

      const { error } = await supabase
        .from("demandas")
        .update(demanda)
        .eq("id", demanda.id);
      if (error) throw error;
      return demanda;
    },
    onSuccess: (_, demanda) => {
      queryClient.invalidateQueries({ queryKey: ["demandas"] });
      toast.success("Demanda atualizada", {
        description: demanda.titulo
          ? `"${demanda.titulo}" foi atualizada.`
          : "As alterações foram salvas.",
      });
    },
    onError: (error) => {
      toast.error("Erro ao atualizar demanda", {
        description: mapDatabaseError(error),
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await softDelete("demandas", id);
      if (!result.success) {
        throw new Error(result.error || "Erro ao deletar demanda");
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["demandas"] });
      toast.success("Demanda removida", {
        description: "O registro foi removido do sistema.",
      });
    },
    onError: (error) => {
      toast.error("Erro ao remover demanda", {
        description: mapDatabaseError(error),
      });
    },
  });

  // Função para concluir demanda com atualização do Caderno
  const concluirDemandaMutation = useMutation({
    mutationFn: async (demanda: Demanda) => {
      let cadernoCount = 0;
      let cadernoError = false;

      // Se for "Envio de carta", atualizar o Caderno
      if (demanda.tipo_demanda === "Envio de carta" && demanda.tipo_carta && demanda.descricao) {
        const numos = extractNumos(demanda.descricao);
        if (numos.length > 0) {
          const { error: cadErr } = await supabase
            .from("caderno")
            .update({
              tipo_carta_enviada: demanda.tipo_carta,
              data_carta: new Date().toISOString().split('T')[0],
            })
            .in("numos", numos);

          if (cadErr) {
            console.error("Erro ao atualizar caderno:", cadErr);
            cadernoError = true;
          } else {
            cadernoCount = numos.length;
          }
        }
      }

      // Atualizar status da demanda
      const { error } = await supabase
        .from("demandas")
        .update({ status: "Concluída" })
        .eq("id", demanda.id);
      if (error) throw error;

      return { demanda, cadernoCount, cadernoError };
    },
    onSuccess: ({ demanda, cadernoCount, cadernoError }) => {
      queryClient.invalidateQueries({ queryKey: ["demandas"] });
      queryClient.invalidateQueries({ queryKey: ["caderno"] });

      if (cadernoError) {
        toast.warning("Demanda concluída com ressalvas", {
          description: `"${demanda.titulo}" foi concluída, mas houve erro ao atualizar o Caderno. Verifique manualmente.`,
        });
      } else {
        toast.success("Demanda concluída", {
          description: `"${demanda.titulo}" foi marcada como concluída.${
            cadernoCount > 0 ? ` Caderno atualizado para ${cadernoCount} OS(s).` : ''
          }`,
        });
      }
    },
    onError: (error) => {
      toast.error("Erro ao concluir demanda", {
        description: mapDatabaseError(error),
      });
    },
  });

  return {
    data: data ?? [],
    isLoading,
    error,
    createDemanda: createMutation.mutate as (demanda: CreateDemandaInput) => void,
    updateDemanda: updateMutation.mutate,
    deleteDemanda: deleteMutation.mutate,
    concluirDemanda: concluirDemandaMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isConcluindo: concluirDemandaMutation.isPending,
  };
}
