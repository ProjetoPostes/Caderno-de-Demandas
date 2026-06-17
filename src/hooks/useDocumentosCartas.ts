import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface DocumentoCarta {
  id: string;
  nome: string;
  descricao: string | null;
  categoria: string;
  url: string;
  criado_por: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentoCartaInput {
  nome: string;
  descricao?: string;
  categoria: string;
  url: string;
}

export function useDocumentosCartas() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: documentos, isLoading, error } = useQuery({
    queryKey: ["documentos-cartas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documentos_cartas")
        .select("*")
        .order("categoria", { ascending: true })
        .order("nome", { ascending: true });

      if (error) throw error;
      return data as DocumentoCarta[];
    },
    enabled: !!user,
  });

  const addMutation = useMutation({
    mutationFn: async (input: DocumentoCartaInput) => {
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("documentos_cartas")
        .insert({
          nome: input.nome,
          descricao: input.descricao || null,
          categoria: input.categoria,
          url: input.url,
          criado_por: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documentos-cartas"] });
      toast.success("Documento adicionado com sucesso!");
    },
    onError: (error: Error) => {
      console.error("Erro ao adicionar documento:", error);
      toast.error("Erro ao adicionar documento. Verifique suas permissões.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...input }: DocumentoCartaInput & { id: string }) => {
      const { data, error } = await supabase
        .from("documentos_cartas")
        .update({
          nome: input.nome,
          descricao: input.descricao || null,
          categoria: input.categoria,
          url: input.url,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documentos-cartas"] });
      toast.success("Documento atualizado com sucesso!");
    },
    onError: (error: Error) => {
      console.error("Erro ao atualizar documento:", error);
      toast.error("Erro ao atualizar documento. Verifique suas permissões.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("documentos_cartas")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documentos-cartas"] });
      toast.success("Documento removido com sucesso!");
    },
    onError: (error: Error) => {
      console.error("Erro ao remover documento:", error);
      toast.error("Erro ao remover documento. Verifique suas permissões.");
    },
  });

  // Extrair categorias únicas dos documentos
  const categorias = documentos
    ? [...new Set(documentos.map((d) => d.categoria))].sort()
    : [];

  return {
    documentos: documentos ?? [],
    categorias,
    isLoading,
    error,
    addDocumento: addMutation.mutateAsync,
    updateDocumento: updateMutation.mutateAsync,
    deleteDocumento: deleteMutation.mutateAsync,
    isAdding: addMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
