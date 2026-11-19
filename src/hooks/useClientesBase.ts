import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { buscarTodos } from "@/lib/buscarTodos";

export interface ClienteBase {
  id_cliente: number;
  cpf: string | null;
  nome: string | null;
  email: string | null;
  telefone: string[] | string | null;
}

export const normCpf = (v: string | null | undefined) => (v ?? "").replace(/\D/g, "");

/** Busca todos os clientes da tabela cliente (em blocos de 1000). */
export function useClientesBase() {
  return useQuery({
    queryKey: ["clientes-base"],
    queryFn: async (): Promise<ClienteBase[]> => {
      const all = await buscarTodos<ClienteBase>((head) =>
        head
          ? supabase.from("cliente").select("id_cliente", { count: "exact", head: true }).is("deleted_at", null)
          : supabase.from("cliente").select("id_cliente, cpf, nome, email, telefone").is("deleted_at", null).order("id_cliente"));
      return all;
    },
  });
}
