import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Despacho } from "@/types/database";
import { toast } from "sonner";
import { mapDatabaseError } from "@/lib/errorHandler";
import { validateAccess, softDelete } from "./useSecurityRpc";

export function useDespacho(showConcluidas = false) {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["despacho", showConcluidas],
    queryFn: async () => {
      // Use RPC to get decrypted sensitive fields
      const { data, error } = await supabase
        .rpc("get_despacho_decrypted", { p_show_concluded: showConcluidas });

      if (error) throw error;
      return (data as unknown as Despacho[]) ?? [];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (item: Partial<Despacho> & { id: string }) => {
      // Validate access before updating
      const access = await validateAccess("despacho", "UPDATE", item.id);
      if (!access.allowed) {
        throw new Error(access.reason);
      }

      const { error } = await supabase
        .from("despacho")
        .update(item)
        .eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["despacho"] });
      toast.success("Registro atualizado com sucesso!");
    },
    onError: (error) => {
      toast.error(mapDatabaseError(error));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // Use soft delete RPC for admin-only deletion with audit
      const result = await softDelete("despacho", id);
      if (!result.success) {
        throw new Error(result.error || "Erro ao deletar registro");
      }
      // Soft delete marks the record, no actual deletion needed
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["despacho"] });
      toast.success("Registro deletado com sucesso!");
    },
    onError: (error) => {
      toast.error(mapDatabaseError(error));
    },
  });

  const importMutation = useMutation({
    mutationFn: async (items: Record<string, unknown>[]) => {
      // Validate access before importing
      const access = await validateAccess("despacho", "INSERT");
      if (!access.allowed) {
        throw new Error(access.reason);
      }

      // Map Excel columns to database columns
      const mappedItems = items.map((item) => ({
        numos: Number(item["NUMOS"] || item["numos"]) || 0,
        dias_para_despacho: Number(item["DIAS_PARA_DESPACHO"] || item["dias_para_despacho"]) || null,
        inconsistencia: Number(item["INCONSISTENCIA"] || item["inconsistencia"]) || null,
        nomelcd: String(item["NOMELCD"] || item["nomelcd"] || ""),
        regional: String(item["REGIONAL"] || item["regional"] || ""),
        nomecli: String(item["NOMECLI"] || item["nomecli"] || ""),
        numcpf: String(item["NUMCPF"] || item["numcpf"] || ""),
        dth_nascimento: String(item["DTH_NASCIMENTO"] || item["dth_nascimento"] || "") || null,
        responsavel: String(item["RESPONSAVEL"] || item["responsavel"] || ""),
        tratativa: String(item["TRATATIVA"] || item["tratativa"] || "Pendente"),
        motivo_da_improcedencia: String(item["MOTIVO_DA_IMPROCEDENCIA"] || item["motivo_da_improcedencia"] || ""),
        base: String(item["BASE"] || item["base"] || ""),
        familia: String(item["FAMILIA"] || item["familia"] || ""),
        telefone: String(item["TELEFONE"] || item["telefone"] || ""),
        email: String(item["EMAIL"] || item["email"] || ""),
        complemento: String(item["COMPLEMENTO"] || item["complemento"] || ""),
        dsclgr_os: String(item["DSCLGR_OS"] || item["dsclgr_os"] || ""),
        criterio: String(item["CRITERIO"] || item["criterio"] || ""),
      }));

      // Insert in batches of 100
      for (let i = 0; i < mappedItems.length; i += 100) {
        const batch = mappedItems.slice(i, i + 100);
        const { error } = await supabase.from("despacho").insert(batch);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["despacho"] });
    },
    onError: (error) => {
      toast.error(mapDatabaseError(error));
    },
  });

  const updateByNumosMutation = useMutation({
    mutationFn: async (items: Record<string, unknown>[]) => {
      // Validate access before batch update
      const access = await validateAccess("despacho", "UPDATE");
      if (!access.allowed) {
        throw new Error(access.reason);
      }

      let updatedCount = 0;
      let notFoundCount = 0;
      
      for (const item of items) {
        const numos = Number(item["NUMOS"] || item["numos"]);
        if (!numos) continue;

        // Build update object with only non-empty values
        const updateData: Record<string, unknown> = {};
        
        if (item["DIAS_PARA_DESPACHO"] || item["dias_para_despacho"]) updateData.dias_para_despacho = Number(item["DIAS_PARA_DESPACHO"] || item["dias_para_despacho"]);
        if (item["INCONSISTENCIA"] || item["inconsistencia"]) updateData.inconsistencia = Number(item["INCONSISTENCIA"] || item["inconsistencia"]);
        if (item["NOMELCD"] || item["nomelcd"]) updateData.nomelcd = String(item["NOMELCD"] || item["nomelcd"]);
        if (item["REGIONAL"] || item["regional"]) updateData.regional = String(item["REGIONAL"] || item["regional"]);
        if (item["NOMECLI"] || item["nomecli"]) updateData.nomecli = String(item["NOMECLI"] || item["nomecli"]);
        if (item["NUMCPF"] || item["numcpf"]) updateData.numcpf = String(item["NUMCPF"] || item["numcpf"]);
        if (item["DTH_NASCIMENTO"] || item["dth_nascimento"]) updateData.dth_nascimento = String(item["DTH_NASCIMENTO"] || item["dth_nascimento"]);
        if (item["RESPONSAVEL"] || item["responsavel"]) updateData.responsavel = String(item["RESPONSAVEL"] || item["responsavel"]);
        if (item["TRATATIVA"] || item["tratativa"]) updateData.tratativa = String(item["TRATATIVA"] || item["tratativa"]);
        if (item["MOTIVO_DA_IMPROCEDENCIA"] || item["motivo_da_improcedencia"]) updateData.motivo_da_improcedencia = String(item["MOTIVO_DA_IMPROCEDENCIA"] || item["motivo_da_improcedencia"]);
        if (item["BASE"] || item["base"]) updateData.base = String(item["BASE"] || item["base"]);
        if (item["FAMILIA"] || item["familia"]) updateData.familia = String(item["FAMILIA"] || item["familia"]);
        if (item["TELEFONE"] || item["telefone"]) updateData.telefone = String(item["TELEFONE"] || item["telefone"]);
        if (item["EMAIL"] || item["email"]) updateData.email = String(item["EMAIL"] || item["email"]);
        if (item["COMPLEMENTO"] || item["complemento"]) updateData.complemento = String(item["COMPLEMENTO"] || item["complemento"]);
        if (item["DSCLGR_OS"] || item["dsclgr_os"]) updateData.dsclgr_os = String(item["DSCLGR_OS"] || item["dsclgr_os"]);
        if (item["CRITERIO"] || item["criterio"]) updateData.criterio = String(item["CRITERIO"] || item["criterio"]);

        if (Object.keys(updateData).length === 0) continue;

        const { data, error } = await supabase
          .from("despacho")
          .update(updateData)
          .eq("numos", numos)
          .select("id");
        
        if (error) throw error;
        if (data && data.length > 0) {
          updatedCount++;
        } else {
          notFoundCount++;
        }
      }
      
      return { updatedCount, notFoundCount };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["despacho"] });
      if (result.notFoundCount > 0) {
        toast.warning(`${result.updatedCount} atualizados, ${result.notFoundCount} não encontrados`);
      }
    },
    onError: (error) => {
      toast.error(mapDatabaseError(error));
    },
  });

  return {
    data: data ?? [],
    isLoading,
    error,
    updateDespacho: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    deleteDespacho: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
    importDespacho: importMutation.mutateAsync,
    isImporting: importMutation.isPending,
    updateDespachoByNumos: updateByNumosMutation.mutateAsync,
    isUpdatingByNumos: updateByNumosMutation.isPending,
  };
}
