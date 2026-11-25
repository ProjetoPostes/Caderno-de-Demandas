import { aplicarFiltroColuna, aplicarFiltroPreenchimento } from "./valoresColuna";

export type ClienteDaObra = { id_cliente: number | null; cliente: { cpf: string | null } | null };

/** Inclui o vínculo por CPF somente quando o prioritário não tem id_cliente. */
export function expressaoClientesDaObra(registros: ClienteDaObra[]): string | null {
  const ids = [...new Set(registros.flatMap(r => r.id_cliente == null ? [] : [r.id_cliente]))];
  const cpfs = new Set<string>();
  for (const r of registros) {
    const cpf = r.cliente?.cpf?.trim();
    if (!cpf) continue;
    cpfs.add(cpf);
    const digitos = cpf.replace(/\D/g, "");
    if (digitos.length === 11) {
      cpfs.add(digitos);
      cpfs.add(`${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6, 9)}-${digitos.slice(9)}`);
    }
  }
  const partes: string[] = [];
  if (ids.length) partes.push(`id_cliente.in.(${ids.join(",")})`);
  if (cpfs.size) {
    const valores = [...cpfs].map(cpf => `"${cpf.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`).join(",");
    partes.push(`and(id_cliente.is.null,cpf_corrigido.in.(${valores}))`);
  }
  return partes.length ? partes.join(",") : null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function aplicarFiltrosPrioritarios(q: any, filtros: Record<string, string | undefined>) {
  for (const [campo, valor] of Object.entries(filtros)) {
    if (["nome_correto", "cpf_correto", "nome_cliente_ligado"].includes(campo)) {
      q = aplicarFiltroPreenchimento(q, campo, valor);
    } else {
      q = aplicarFiltroColuna(q, campo, valor);
    }
  }
  return q;
}