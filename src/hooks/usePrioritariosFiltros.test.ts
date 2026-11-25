import { expect, mock, test } from "bun:test";
import { FILTRO_EM_BRANCO, FILTRO_PREENCHIDO } from "../lib/valoresColuna";

const chamadas: unknown[][] = [];
let clientes = [{ id_cliente: 42, cliente: { cpf: "12345678901" } }];
mock.module("@/integrations/supabase/client", () => ({ supabase: {
  from: (tabela: string) => {
    let head = false;
    const q = {
      select: (campos: string, opts?: { head?: boolean }) => { head = opts?.head ?? false; chamadas.push([tabela, "select", campos]); return q; },
      is: (...args: unknown[]) => { chamadas.push([tabela, "is", ...args]); return q; },
      eq: (...args: unknown[]) => { chamadas.push([tabela, "eq", ...args]); return q; },
      or: (...args: unknown[]) => { chamadas.push([tabela, "or", ...args]); return q; },
      not: (...args: unknown[]) => { chamadas.push([tabela, "not", ...args]); return q; },
      neq: (...args: unknown[]) => { chamadas.push([tabela, "neq", ...args]); return q; },
      order: (...args: unknown[]) => { chamadas.push([tabela, "order", ...args]); return q; },
      range: (...args: unknown[]) => { chamadas.push([tabela, "range", ...args]); return q; },
      then: (resolve: (v: unknown) => unknown) => Promise.resolve(resolve({
        data: head ? null : tabela === "caderno" ? clientes : [{ id: 7 }],
        count: tabela === "caderno" ? clientes.length : 21, error: null,
      })),
    };
    return q;
  },
} }));
mock.module("@tanstack/react-query", () => ({ useQuery: (opts: unknown) => opts, useMutation: mock(), useQueryClient: mock() }));
mock.module("@/contexts/AuthContext", () => ({ useAuth: mock() }));
mock.module("sonner", () => ({ toast: {} }));
const { usePrioritarios } = await import("./useTabelasOperacionais");

test("filtra obra pelas OS ativas e aplica presença antes da paginação", async () => {
  const q = usePrioritarios({ page: 2, pageSize: 20, filters: {
    obra: "5807", nome_correto: FILTRO_EM_BRANCO, cpf_correto: FILTRO_PREENCHIDO,
  } }) as unknown as { queryFn: () => Promise<unknown> };
  expect(await q.queryFn()).toEqual({ rows: [{ id: 7 }], total: 21 });
  expect(chamadas).toContainEqual(["caderno", "eq", "obra.num_obra", "5807"]);
  expect(chamadas).toContainEqual(["caderno", "is", "deleted_at", null]);
  expect(chamadas).toContainEqual(["caderno", "order", "id_os", { ascending: true }]);
  expect(chamadas).toContainEqual(["prioritario", "or", 'id_cliente.in.(42),and(id_cliente.is.null,cpf_corrigido.in.("12345678901","123.456.789-01"))']);
  expect(chamadas).toContainEqual(["prioritario", "or", "nome_correto.is.null,nome_correto.eq."]);
  expect(chamadas).toContainEqual(["prioritario", "not", "cpf_correto", "is", null]);
  expect(chamadas).toContainEqual(["prioritario", "neq", "cpf_correto", ""]);
  expect(chamadas.at(-1)).toEqual(["prioritario", "range", 20, 39]);
});

test("obra sem OS vinculadas retorna total zero sem listar prioritários", async () => {
  chamadas.length = 0;
  clientes = [];
  const q = usePrioritarios({ filters: { obra: "9999" } }) as unknown as { queryFn: () => Promise<unknown> };
  expect(await q.queryFn()).toEqual({ rows: [], total: 0 });
  expect(chamadas.some(c => c[0] === "prioritario")).toBe(false);
});