/**
 * Lê todas as linhas de uma consulta Supabase mesmo quando o servidor limita
 * linhas por resposta: conta o total, mede o tamanho real do 1º bloco e busca
 * o restante em paralelo (lotes de 8).
 */
type Resp<T> = { data: T[] | null; error: unknown; count?: number | null };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function buscarTodos<T>(consulta: (head: boolean) => any, size = 1000): Promise<T[]> {
  const c = (await consulta(true)) as Resp<T>;
  if (c.error) throw c.error;
  const total = c.count ?? 0;
  const primeira = (await consulta(false).range(0, size - 1)) as Resp<T>;
  if (primeira.error) throw primeira.error;
  const all: T[] = [...(primeira.data ?? [])];
  const passo = Math.max(all.length, 1);
  const offsets: number[] = [];
  for (let o = all.length; o < total; o += passo) offsets.push(o);
  for (let i = 0; i < offsets.length; i += 8) {
    const lote = (await Promise.all(offsets.slice(i, i + 8).map((o) => consulta(false).range(o, o + passo - 1)))) as Resp<T>[];
    for (const r of lote) { if (r.error) throw r.error; all.push(...(r.data ?? [])); }
  }
  return all;
}
