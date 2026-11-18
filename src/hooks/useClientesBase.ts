import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
      const all: ClienteBase[] = [];
      const size = 10000;
      for (let from = 0; ; from += size) {
        const { data, error } = await supabase
          .from("cliente")
          .select("id_cliente, cpf, nome, email, telefone")
          .is("deleted_at", null)
          .order("id_cliente")
          .range(from, from + size - 1);
        if (error) throw error;
        all.push(...((data ?? []) as ClienteBase[]));
        if (!data || data.length < size) break;
      }
      return all;
    },
  });
}
