import { expect, test } from "bun:test";
import { buscarTodos } from "./buscarTodos";
import { valoresUnicosColuna } from "./valoresColuna";

test("valores únicos incluem as páginas posteriores mesmo com limite de 10 linhas", async () => {
  const rows = Array.from({ length: 31 }, (_, id) => ({ id,
    decisao: id < 10 ? "MANTIDO" : id < 20 ? "RETIRADO" : "SUBSTITUIR" }));
  const ranges: number[][] = [];
  const consulta = (head: boolean) => head
    ? Promise.resolve({ count: rows.length, data: null, error: null })
    : { range: async (start: number, end: number) => {
      ranges.push([start, end]);
      return { data: rows.slice(start, Math.min(end + 1, start + 10)), error: null };
    } };
  const result = await buscarTodos<(typeof rows)[number]>(consulta);
  expect(result.map(r => r.id)).toEqual(rows.map(r => r.id));
  expect(ranges).toEqual([[0, 999], [10, 19], [20, 29], [30, 39]]);
  expect(valoresUnicosColuna(result.map(r => r.decisao)).map(v => v.value))
    .toEqual(["MANTIDO", "RETIRADO", "SUBSTITUIR"]);
});

test("erro em página posterior não é confundido com uma lista completa de filtros", async () => {
  const consulta = (head: boolean) => head
    ? Promise.resolve({ count: 2, data: null, error: null })
    : { range: async (start: number) => start === 0
      ? { data: [{ decisao: "MANTIDO" }], error: null }
      : { data: null, error: new Error("Consulta interrompida") } };
  await expect(buscarTodos(consulta)).rejects.toThrow("Consulta interrompida");
});