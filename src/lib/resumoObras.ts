export interface FiltrosResumoObras {
  search?: string;
  filters?: Record<string, string | undefined>;
}

export function parametrosObras(
  { search = "", filters }: FiltrosResumoObras,
  page = 1,
  pageSize = 20,
  sortField = "num_obra",
  sortDir: "asc" | "desc" = "asc",
) {
  const { tranche, ...outrosFiltros } = filters ?? {};
  return {
    p_tranche: tranche?.trim() || null,
    p_search: search.trim() || null,
    p_filters: outrosFiltros,
    p_page: page,
    p_page_size: pageSize,
    p_sort_field: sortField,
    p_sort_dir: sortDir,
  };
}

export interface ObraResumoFonte {
  id_obra: number;
  valor_orcado?: number | string | null;
  valor_realizado?: number | string | null;
}

export interface ResumoObras {
  numeroObras: number;
  valorOrcado: number;
  valorRealizado: number;
}

/** Percorre o resultado completo da mesma RPC usada na tabela, não só a página visível. */
export async function obrasFiltradasParaResumo(
  consultar: (page: number, pageSize: number) => Promise<{ rows: ObraResumoFonte[]; total: number }>,
): Promise<ObraResumoFonte[]> {
  const pageSize = 500;
  const primeira = await consultar(1, pageSize);
  const obras = new Map(primeira.rows.map(row => [row.id_obra, row]));
  for (let page = 2; obras.size < primeira.total; page++) {
    const resultado = await consultar(page, pageSize);
    const tamanhoAnterior = obras.size;
    for (const row of resultado.rows) obras.set(row.id_obra, row);
    if (obras.size === tamanhoAnterior) throw new Error("Não foi possível carregar todas as obras para os totais.");
  }
  return [...obras.values()];
}

export function somarResumoObras(obras: ObraResumoFonte[]): ResumoObras {
  const numero = (valor: number | string | null | undefined) => {
    if (valor == null || valor === "") return 0;
    const resultado = Number(valor);
    if (!Number.isFinite(resultado)) throw new Error("Uma obra possui valor financeiro inválido.");
    return resultado;
  };
  return {
    numeroObras: obras.length,
    valorOrcado: obras.reduce((total, obra) => total + numero(obra.valor_orcado), 0),
    valorRealizado: obras.reduce((total, obra) => total + numero(obra.valor_realizado), 0),
  };
}