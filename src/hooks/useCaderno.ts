import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Caderno } from "@/types/database";
import { toast } from "sonner";
import { mapDatabaseError } from "@/lib/errorHandler";
import { validateAccess, softDelete } from "./useSecurityRpc";

export function useCaderno(limit = 1000) {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["caderno", limit],
    queryFn: async () => {
      // Use RPC to get decrypted sensitive fields
      const { data, error } = await supabase
        .rpc("get_caderno_decrypted", { p_show_deleted: false });

      if (error) throw error;
      const rows = (data as unknown as Caderno[]) ?? [];
      return rows.slice(0, limit);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (item: Partial<Caderno> & { id: string }) => {
      // Validate access before updating
      const access = await validateAccess("caderno", "UPDATE", item.id);
      if (!access.allowed) {
        throw new Error(access.reason);
      }

      const { error } = await supabase
        .from("caderno")
        .update(item)
        .eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["caderno"] });
      toast.success("Registro atualizado com sucesso!");
    },
    onError: (error) => {
      toast.error(mapDatabaseError(error));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // Use soft delete RPC for admin-only deletion with audit
      const result = await softDelete("caderno", id);
      if (!result.success) {
        throw new Error(result.error || "Erro ao deletar registro");
      }
      // Soft delete marks the record, no actual deletion needed
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["caderno"] });
      toast.success("Registro deletado com sucesso!");
    },
    onError: (error) => {
      toast.error(mapDatabaseError(error));
    },
  });

  const importMutation = useMutation({
    mutationFn: async (items: Record<string, unknown>[]) => {
      // Validate access before importing
      const access = await validateAccess("caderno", "INSERT");
      if (!access.allowed) {
        throw new Error(access.reason);
      }

      // Map Excel columns to database columns
      const mappedItems = items.map((item) => ({
        numos: Number(item["NUMOS"] || item["numos"]) || 0,
        numobra: Number(item["NUMOBRA"] || item["numobra"]) || null,
        status: String(item["STATUS"] || item["status"] || ""),
        nomelcd: String(item["NOMELCD"] || item["nomelcd"] || ""),
        regional: String(item["REGIONAL"] || item["regional"] || ""),
        controle_os: String(item["CONTROLE_OS"] || item["controle_os"] || "Aberta"),
        origem: String(item["ORIGEM"] || item["origem"] || ""),
        prazo: String(item["PRAZO"] || item["prazo"] || ""),
        nomecli: String(item["NOMECLI"] || item["nomecli"] || ""),
        numcpf: String(item["NUMCPF"] || item["numcpf"] || ""),
        dth_nascimento: String(item["DTH_NASCIMENTO"] || item["dth_nascimento"] || ""),
        email: String(item["EMAIL"] || item["email"] || ""),
        numtel: String(item["NUMTEL"] || item["numtel"] || ""),
        numtel2: String(item["NUMTEL2"] || item["numtel2"] || ""),
        complemento: String(item["COMPLEMENTO"] || item["complemento"] || ""),
        dsclgr_os: String(item["DSCLGR_OS"] || item["dsclgr_os"] || ""),
        datasol: String(item["DATASOL"] || item["datasol"] || "") || null,
        datacontab: String(item["DATACONTAB"] || item["datacontab"] || "") || null,
        data_766: String(item["DATA_766"] || item["data_766"] || "") || null,
        dataprev: String(item["DATAPREV"] || item["dataprev"] || "") || null,
        datatertrab: String(item["DATATERTRAB"] || item["datatertrab"] || "") || null,
        dth_envio_dineng: String(item["DTH_ENVIO_DINENG"] || item["dth_envio_dineng"] || "") || null,
        dth_retorno_dineng: String(item["DTH_RETORNO_DINENG"] || item["dth_retorno_dineng"] || "") || null,
        dth_impedimento: String(item["DTH_IMPEDIMENTO"] || item["dth_impedimento"] || "") || null,
        motivo_improcedencia: String(item["MOTIVO_IMPROCEDENCIA"] || item["motivo_improcedencia"] || ""),
        pendencia_obra: String(item["PENDENCIA_OBRA"] || item["pendencia_obra"] || ""),
        criterio: String(item["CRITERIO"] || item["criterio"] || ""),
        tipo_carta_enviada: String(item["TIPO_CARTA_ENVIADA"] || item["tipo_carta_enviada"] || ""),
        base_5311: String(item["BASE_5311"] || item["base_5311"] || ""),
        tranche: String(item["TRANCHE"] || item["tranche"] || ""),
        responsavel: String(item["RESPONSAVEL"] || item["responsavel"] || ""),
        prioridade: String(item["PRIORIDADE"] || item["prioridade"] || ""),
        observacao: String(item["OBSERVACAO"] || item["observacao"] || ""),
        empreiteira: String(item["EMPREITEIRA"] || item["empreiteira"] || ""),
        data_recebimento: String(item["DATA_RECEBIMENTO"] || item["data_recebimento"] || "") || null,
        bloco_cliente: String(item["BLOCO_CLIENTE"] || item["bloco_cliente"] || ""),
        data_carta: String(item["DATA_CARTA"] || item["data_carta"] || "") || null,
      }));

      // Insert in batches of 100
      for (let i = 0; i < mappedItems.length; i += 100) {
        const batch = mappedItems.slice(i, i + 100);
        const { error } = await supabase.from("caderno").insert(batch);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["caderno"] });
    },
    onError: (error) => {
      toast.error(mapDatabaseError(error));
    },
  });

  const updateByNumosMutation = useMutation({
    mutationFn: async (items: Record<string, unknown>[]) => {
      // Validate access before batch update
      const access = await validateAccess("caderno", "UPDATE");
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
        
        if (item["NUMOBRA"] || item["numobra"]) updateData.numobra = Number(item["NUMOBRA"] || item["numobra"]);
        if (item["STATUS"] || item["status"]) updateData.status = String(item["STATUS"] || item["status"]);
        if (item["NOMELCD"] || item["nomelcd"]) updateData.nomelcd = String(item["NOMELCD"] || item["nomelcd"]);
        if (item["REGIONAL"] || item["regional"]) updateData.regional = String(item["REGIONAL"] || item["regional"]);
        if (item["CONTROLE_OS"] || item["controle_os"]) updateData.controle_os = String(item["CONTROLE_OS"] || item["controle_os"]);
        if (item["ORIGEM"] || item["origem"]) updateData.origem = String(item["ORIGEM"] || item["origem"]);
        if (item["PRAZO"] || item["prazo"]) updateData.prazo = String(item["PRAZO"] || item["prazo"]);
        if (item["NOMECLI"] || item["nomecli"]) updateData.nomecli = String(item["NOMECLI"] || item["nomecli"]);
        if (item["NUMCPF"] || item["numcpf"]) updateData.numcpf = String(item["NUMCPF"] || item["numcpf"]);
        if (item["DTH_NASCIMENTO"] || item["dth_nascimento"]) updateData.dth_nascimento = String(item["DTH_NASCIMENTO"] || item["dth_nascimento"]);
        if (item["EMAIL"] || item["email"]) updateData.email = String(item["EMAIL"] || item["email"]);
        if (item["NUMTEL"] || item["numtel"]) updateData.numtel = String(item["NUMTEL"] || item["numtel"]);
        if (item["NUMTEL2"] || item["numtel2"]) updateData.numtel2 = String(item["NUMTEL2"] || item["numtel2"]);
        if (item["COMPLEMENTO"] || item["complemento"]) updateData.complemento = String(item["COMPLEMENTO"] || item["complemento"]);
        if (item["DSCLGR_OS"] || item["dsclgr_os"]) updateData.dsclgr_os = String(item["DSCLGR_OS"] || item["dsclgr_os"]);
        if (item["DATASOL"] || item["datasol"]) updateData.datasol = String(item["DATASOL"] || item["datasol"]);
        if (item["DATACONTAB"] || item["datacontab"]) updateData.datacontab = String(item["DATACONTAB"] || item["datacontab"]);
        if (item["DATA_766"] || item["data_766"]) updateData.data_766 = String(item["DATA_766"] || item["data_766"]);
        if (item["DATAPREV"] || item["dataprev"]) updateData.dataprev = String(item["DATAPREV"] || item["dataprev"]);
        if (item["DATATERTRAB"] || item["datatertrab"]) updateData.datatertrab = String(item["DATATERTRAB"] || item["datatertrab"]);
        if (item["DTH_ENVIO_DINENG"] || item["dth_envio_dineng"]) updateData.dth_envio_dineng = String(item["DTH_ENVIO_DINENG"] || item["dth_envio_dineng"]);
        if (item["DTH_RETORNO_DINENG"] || item["dth_retorno_dineng"]) updateData.dth_retorno_dineng = String(item["DTH_RETORNO_DINENG"] || item["dth_retorno_dineng"]);
        if (item["DTH_IMPEDIMENTO"] || item["dth_impedimento"]) updateData.dth_impedimento = String(item["DTH_IMPEDIMENTO"] || item["dth_impedimento"]);
        if (item["MOTIVO_IMPROCEDENCIA"] || item["motivo_improcedencia"]) updateData.motivo_improcedencia = String(item["MOTIVO_IMPROCEDENCIA"] || item["motivo_improcedencia"]);
        if (item["PENDENCIA_OBRA"] || item["pendencia_obra"]) updateData.pendencia_obra = String(item["PENDENCIA_OBRA"] || item["pendencia_obra"]);
        if (item["CRITERIO"] || item["criterio"]) updateData.criterio = String(item["CRITERIO"] || item["criterio"]);
        if (item["TIPO_CARTA_ENVIADA"] || item["tipo_carta_enviada"]) updateData.tipo_carta_enviada = String(item["TIPO_CARTA_ENVIADA"] || item["tipo_carta_enviada"]);
        if (item["BASE_5311"] || item["base_5311"]) updateData.base_5311 = String(item["BASE_5311"] || item["base_5311"]);
        if (item["TRANCHE"] || item["tranche"]) updateData.tranche = String(item["TRANCHE"] || item["tranche"]);
        if (item["RESPONSAVEL"] || item["responsavel"]) updateData.responsavel = String(item["RESPONSAVEL"] || item["responsavel"]);
        if (item["PRIORIDADE"] || item["prioridade"]) updateData.prioridade = String(item["PRIORIDADE"] || item["prioridade"]);
        if (item["OBSERVACAO"] || item["observacao"]) updateData.observacao = String(item["OBSERVACAO"] || item["observacao"]);
        if (item["EMPREITEIRA"] || item["empreiteira"]) updateData.empreiteira = String(item["EMPREITEIRA"] || item["empreiteira"]);
        if (item["DATA_RECEBIMENTO"] || item["data_recebimento"]) updateData.data_recebimento = String(item["DATA_RECEBIMENTO"] || item["data_recebimento"]);
        if (item["BLOCO_CLIENTE"] || item["bloco_cliente"]) updateData.bloco_cliente = String(item["BLOCO_CLIENTE"] || item["bloco_cliente"]);
        if (item["DATA_CARTA"] || item["data_carta"]) updateData.data_carta = String(item["DATA_CARTA"] || item["data_carta"]);

        if (Object.keys(updateData).length === 0) continue;

        const { data, error } = await supabase
          .from("caderno")
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
      queryClient.invalidateQueries({ queryKey: ["caderno"] });
      if (result.notFoundCount > 0) {
        toast.warning(`${result.updatedCount} atualizados, ${result.notFoundCount} não encontrados`);
      }
    },
    onError: (error) => {
      toast.error(mapDatabaseError(error));
    },
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ ids, updates }: { ids: string[]; updates: Partial<Caderno> }) => {
      // Validate access before bulk update
      const access = await validateAccess("caderno", "UPDATE");
      if (!access.allowed) {
        throw new Error(access.reason);
      }

      let successCount = 0;
      let failedCount = 0;

      // Update records in batches for better performance
      for (const id of ids) {
        try {
          const { error } = await supabase
            .from("caderno")
            .update(updates)
            .eq("id", id);
          
          if (error) {
            failedCount++;
          } else {
            successCount++;
          }
        } catch {
          failedCount++;
        }
      }

      return { successCount, failedCount };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["caderno"] });
      if (result.failedCount === 0) {
        toast.success(`${result.successCount} registros atualizados com sucesso!`);
      } else {
        toast.warning(`${result.successCount} atualizados, ${result.failedCount} falharam`);
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
    updateCaderno: updateMutation,
    isUpdating: updateMutation.isPending,
    deleteCaderno: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
    importCaderno: importMutation.mutateAsync,
    isImporting: importMutation.isPending,
    updateCadernoByNumos: updateByNumosMutation.mutateAsync,
    isUpdatingByNumos: updateByNumosMutation.isPending,
    bulkUpdateCaderno: bulkUpdateMutation.mutateAsync,
    isBulkUpdating: bulkUpdateMutation.isPending,
  };
}
