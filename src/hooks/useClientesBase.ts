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
      const size = 1000;
      const base = () => supabase.from("cliente").select("id_cliente, cpf, nome, email, telefone").is("deleted_at", null);
      const { count, error: eCount } = await supabase
        .from("cliente").select("id_cliente", { count: "exact", head: true }).is("deleted_at", null);
      if (eCount) throw eCount;
      const total = count ?? 0;
      const primeira = await base().order("id_cliente").range(0, size - 1);
      if (primeira.error) throw primeira.error;
      const all: ClienteBase[] = [...((primeira.data ?? []) as ClienteBase[])];
      // O servidor pode devolver menos que "size" por resposta; usa o tamanho real
      // do bloco e busca o restante em paralelo (lotes de 8).
      const passo = Math.max(all.length, 1);
      const offsets: number[] = [];
      for (let o = all.length; o < total; o += passo) offsets.push(o);
      for (let i = 0; i < offsets.length; i += 8) {
        const lote = await Promise.all(offsets.slice(i, i + 8).map((o) =>
          base().order("id_cliente").range(o, o + passo - 1)));
        for (const r of lote) { if (r.error) throw r.error; all.push(...((r.data ?? []) as ClienteBase[])); }
      }
      return all;
    },
  });
}
