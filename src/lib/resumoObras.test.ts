import { describe, expect, test } from "bun:test";
import { obrasFiltradasParaResumo, parametrosObras, somarResumoObras } from "./resumoObras";

describe("indicadores das obras filtradas", () => {
  test("número de obras considera todas as páginas, sem repetir obras", async () => {
    const rows = await obrasFiltradasParaResumo(async page => ({
      total: 3,
      rows: page === 1 ? [{ id_obra: 1 }, { id_obra: 2 }] : [{ id_obra: 3 }],
    }));
    expect(somarResumoObras(rows).numeroObras).toBe(3);
  });
  test("valor orçado soma todas as obras filtradas e trata nulos como zero", () => {
    expect(somarResumoObras([
      { id_obra: 1, valor_orcado: 1200.50 },
      { id_obra: 2, valor_orcado: "300.25" },
      { id_obra: 3, valor_orcado: null },
    ]).valorOrcado).toBe(1500.75);
  });
  test("valor realizado é independente do orçamento", () => {
    expect(somarResumoObras([
      { id_obra: 1, valor_orcado: 1200, valor_realizado: 800.25 },
      { id_obra: 2, valor_orcado: 300, valor_realizado: "200.50" },
    ]).valorRealizado).toBe(1000.75);
  });
  test("status_unificado e os outros filtros são enviados à mesma RPC, com tranche separada", () => {
    expect(parametrosObras({ search: " 123 ", filters: { tranche: "7ª tranche", status_unificado: "EXECUTADA", ods: "45" } }, 2, 500, "id_obra")).toEqual({
      p_tranche: "7ª tranche", p_search: "123", p_filters: { status_unificado: "EXECUTADA", ods: "45" },
      p_page: 2, p_page_size: 500, p_sort_field: "id_obra", p_sort_dir: "asc",
    });
  });
  test("resultado vazio tem três totais zero", () => {
    expect(somarResumoObras([])).toEqual({ numeroObras: 0, valorOrcado: 0, valorRealizado: 0 });
  });
  test("não apresenta total parcial quando a paginação falha", async () => {
    await expect(obrasFiltradasParaResumo(async () => ({ rows: [{ id_obra: 1 }], total: 2 }))).rejects.toThrow("todas as obras");
  });
});