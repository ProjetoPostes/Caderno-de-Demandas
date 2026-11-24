import { describe, expect, mock, test } from "bun:test";

const catalogo = Array.from({ length: 13 }, (_, i) => ({
  id: String(i + 1), nome: i === 12 ? "Transformador" : `Item ${i + 1}`,
  categoria: "Equipamentos", unidade: "un",
}));
const itens = catalogo.map((tipo) => ({
  id: tipo.id, obra_id: 42, tipo_quantitativo_id: tipo.id, quantidade: 1, tipo,
}));
let falharPagina = false;
const chamadas: { tabela: string; ordens: string[]; obra?: number }[] = [];

mock.module("@/integrations/supabase/client", () => ({ supabase: {
  from: (tabela: string) => ({
    select: (_campos: string, options: { head: boolean }) => {
      const chamada: (typeof chamadas)[number] = { tabela, ordens: [] };
      chamadas.push(chamada);
      const rows = tabela === "tipos_quantitativos" ? catalogo : itens;
      const query = {
        order: (campo: string) => { chamada.ordens.push(campo); return query; },
        eq: (_campo: string, obra: number) => { chamada.obra = obra; return query; },
        then: (resolve: (value: unknown) => unknown) => Promise.resolve({ count: rows.length, data: null, error: null }).then(resolve),
        range: async (inicio: number, fim: number) => {
          if (falharPagina && inicio > 0) return { data: null, error: new Error("Falha na página") };
          return { data: rows.slice(inicio, Math.min(fim + 1, inicio + 10)), error: null };
        },
      };
      return query;
    },
  }),
} }));
mock.module("@tanstack/react-query", () => ({
  useQuery: (options: unknown) => options, useMutation: mock(), useQueryClient: mock(),
}));
const { useTiposQuantitativos, useQuantitativosObra } = await import("./useValidacaoObra");
const options = <T>(query: unknown) => query as { queryFn: () => Promise<T> };

describe("carregamento completo dos quantitativos", () => {
  test("Transformador aparece mesmo depois das primeiras 10 linhas do catálogo", async () => {
    chamadas.length = 0;
    const resultado = await options<typeof catalogo>(useTiposQuantitativos()).queryFn();
    expect(resultado).toEqual(catalogo);
    expect(resultado.filter((t) => t.categoria === "Equipamentos").some((t) => t.nome === "Transformador")).toBe(true);
    expect(chamadas.every((c) => c.ordens.join(",") === "nome,id")).toBe(true);
  });

  test("lista todos os itens salvos sem perder a restrição à obra", async () => {
    chamadas.length = 0;
    expect(await options<typeof itens>(useQuantitativosObra(42)).queryFn()).toEqual(itens);
    expect(chamadas.every((c) => c.obra === 42 && c.ordens.join(",") === "id")).toBe(true);
  });

  test("não retorna um catálogo incompleto quando uma página falha", async () => {
    falharPagina = true;
    try {
      await expect(options(useTiposQuantitativos()).queryFn()).rejects.toThrow("Falha na página");
    } finally { falharPagina = false; }
  });
});