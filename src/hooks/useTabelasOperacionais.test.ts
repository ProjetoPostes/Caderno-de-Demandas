/// <reference types="bun" />
import { beforeEach, describe, expect, mock, test } from "bun:test";

const rpc = mock(async (_name: string, _params: unknown): Promise<{ data: unknown; error: unknown }> => ({
  data: { rows: [], total: 0 }, error: null,
}));
const eq = mock(async (_field: string, _value: number) => ({ count: 12 }));
const is = mock((_field: string, _value: null) => ({ eq }));
const select = mock((_field: string, _options: unknown) => ({ is }));
const from = mock((_table: string) => ({ select }));

mock.module("@/integrations/supabase/client", () => ({ supabase: { rpc, from } }));
mock.module("@tanstack/react-query", () => ({
  useQuery: (options: unknown) => options,
  useMutation: mock(), useQueryClient: mock(),
}));
mock.module("@/contexts/AuthContext", () => ({ useAuth: mock() }));
mock.module("sonner", () => ({ toast: {} }));

const { useObras, useObraOsCounts } = await import("./useTabelasOperacionais");
// The mocked useQuery exposes its options without mounting a React component.
function queryOptions<T>(value: unknown) {
  return value as { queryKey: unknown[]; queryFn: () => Promise<T> };
}

beforeEach(() => {
  rpc.mockClear(); from.mockClear(); select.mockClear(); is.mockClear(); eq.mockClear();
  rpc.mockResolvedValue({ data: { rows: [], total: 0 }, error: null });
});

describe("useObras RPC contract", () => {
  test("passes the selected tranche separately and preserves the remaining query parameters", async () => {
    const params = {
      page: 3, pageSize: 25, search: "  123  ", sortField: "status", sortDir: "desc" as const,
      filters: { tranche: "Tranche 01", status: "Ativa", etapa: "Etapa 02" },
    };
    const query = queryOptions(useObras(params));
    await query.queryFn();
    expect(rpc).toHaveBeenCalledWith("get_obras_filtradas", {
      p_tranche: "Tranche 01", p_search: "123",
      p_filters: { status: "Ativa", etapa: "Etapa 02" },
      p_page: 3, p_page_size: 25, p_sort_field: "status", p_sort_dir: "desc",
    });
    expect(query.queryKey).toEqual(["obras", params]);
    expect(from).not.toHaveBeenCalled();
  });

  test("sends null for missing tranche and search and preserves pagination defaults", async () => {
    await queryOptions(useObras()).queryFn();
    expect(rpc).toHaveBeenCalledWith("get_obras_filtradas", {
      p_tranche: null, p_search: null, p_filters: {},
      p_page: 1, p_page_size: 20, p_sort_field: "num_obra", p_sort_dir: "asc",
    });
  });

  test("treats whitespace-only tranche and search as absent", async () => {
    await queryOptions(useObras({ search: "  ", filters: { tranche: "  " } })).queryFn();
    expect(rpc.mock.calls[0]?.[1]).toMatchObject({ p_tranche: null, p_search: null, p_filters: {} });
  });

  test("uses the RPC total rather than the current page length", async () => {
    const result = { rows: [{ id_obra: 42, num_obra: "123" }], total: 87 };
    rpc.mockResolvedValue({ data: result, error: null });
    expect(await queryOptions(useObras()).queryFn()).toEqual(result);
  });

  test("propagates RPC failures rather than silently returning an empty list", async () => {
    const error = new Error("RPC failed");
    rpc.mockResolvedValue({ data: null, error });
    await expect(queryOptions(useObras()).queryFn()).rejects.toThrow("RPC failed");
  });

  test("keeps OS counts independent of the selected tranche and counts only active OSs", async () => {
    await queryOptions(useObras({ filters: { tranche: "Tranche 01" } })).queryFn();
    const result = await queryOptions(useObraOsCounts([42])).queryFn();
    expect(result).toEqual({ 42: 12 });
    expect(from).toHaveBeenCalledWith("caderno");
    expect(select).toHaveBeenCalledWith("id_os", { count: "exact", head: true });
    expect(is).toHaveBeenCalledTimes(1);
    expect(is).toHaveBeenCalledWith("deleted_at", null);
    expect(eq).toHaveBeenCalledTimes(1);
    expect(eq).toHaveBeenCalledWith("id_obra", 42);
  });
});