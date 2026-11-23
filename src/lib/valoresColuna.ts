export const FILTRO_NULO = "__COLUMN_NULL__";
export const FILTRO_VAZIO = "__COLUMN_EMPTY__";

export interface OpcaoColuna { value: string; label: string }

/** Preserve o valor original: diferenças de caixa também existem no banco. */
export function valoresUnicosColuna(valores: unknown[], incluirVazios = true): OpcaoColuna[] {
  const opcoes = new Map<string, string>();
  for (const valor of valores) {
    if (valor === undefined) continue;
    if (valor === null) {
      if (incluirVazios) opcoes.set(FILTRO_NULO, "Não informado");
    } else if (valor === "") {
      if (incluirVazios) opcoes.set(FILTRO_VAZIO, "Vazio");
    } else {
      opcoes.set(String(valor), typeof valor === "boolean" ? (valor ? "Sim" : "Não") : String(valor));
    }
  }
  return [...opcoes].map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label, "pt-BR", { numeric: true }));
}

interface ConsultaFiltro<Q> {
  eq: (campo: string, valor: string) => Q;
  is: (campo: string, valor: null) => Q;
}

export function aplicarFiltroColuna<Q extends ConsultaFiltro<Q>>(q: Q, campo: string, valor?: string): Q {
  if (!valor) return q;
  if (valor === FILTRO_NULO) return q.is(campo, null);
  return q.eq(campo, valor === FILTRO_VAZIO ? "" : valor);
}