export const FILTRO_NULO = "__COLUMN_NULL__";
export const FILTRO_VAZIO = "__COLUMN_EMPTY__";
export const FILTRO_PREENCHIDO = "__COLUMN_FILLED__";
export const FILTRO_EM_BRANCO = "__COLUMN_BLANK__";

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

interface ConsultaPreenchimento<Q> {
  or: (expressao: string) => Q;
  not: (campo: string, operador: "is", valor: null) => Q;
  neq: (campo: string, valor: string) => Q;
}

/** Vazio inclui tanto NULL quanto string vazia; preenchido exclui ambos. */
export function aplicarFiltroPreenchimento<Q extends ConsultaPreenchimento<Q>>(q: Q, campo: string, valor?: string): Q {
  if (valor === FILTRO_EM_BRANCO) return q.or(`${campo}.is.null,${campo}.eq.`);
  if (valor === FILTRO_PREENCHIDO) return q.not(campo, "is", null).neq(campo, "");
  return q;
}

export function aplicarFiltroColuna<Q extends ConsultaFiltro<Q>>(q: Q, campo: string, valor?: string): Q {
  if (!valor) return q;
  if (valor === FILTRO_NULO) return q.is(campo, null);
  return q.eq(campo, valor === FILTRO_VAZIO ? "" : valor);
}