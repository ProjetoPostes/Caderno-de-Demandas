import { describe, expect, test } from "bun:test";
import { aplicarFiltroColuna, aplicarFiltroPreenchimento, FILTRO_NULO, FILTRO_VAZIO, FILTRO_PREENCHIDO, FILTRO_EM_BRANCO, valoresUnicosColuna } from "./valoresColuna";

describe("valores reais dos filtros", () => {
  test("cliente ligado vazio inclui nulo e string vazia", () => {
    const calls: unknown[] = [];
    const q = { or: (v: string) => { calls.push(["or", v]); return q; },
      not: () => q, neq: () => q };
    aplicarFiltroPreenchimento(q, "nome_cliente_ligado", FILTRO_EM_BRANCO);
    expect(calls).toEqual([["or", "nome_cliente_ligado.is.null,nome_cliente_ligado.eq."]]);
  });
  test("cliente ligado preenchido exclui nulo e string vazia", () => {
    const calls: unknown[] = [];
    const q = { or: () => q,
      not: (f: string, op: string, v: null) => { calls.push(["not", f, op, v]); return q; },
      neq: (f: string, v: string) => { calls.push(["neq", f, v]); return q; } };
    aplicarFiltroPreenchimento(q, "nome_cliente_ligado", FILTRO_PREENCHIDO);
    expect(calls).toEqual([["not", "nome_cliente_ligado", "is", null], ["neq", "nome_cliente_ligado", ""]]);
  });
  test("lista todos os valores distintos sem inventar nem canonicalizar decisões", () => {
    const values = valoresUnicosColuna(["MANTIDO", "SUBSTITUIR", "RETIRADO", "SUBSTITUIR", "Retirado"]);
    expect(values.map(v => v.value).sort()).toEqual(["MANTIDO", "RETIRADO", "Retirado", "SUBSTITUIR"]);
  });
  test("opções booleanas dependem dos valores que existem", () => {
    expect(valoresUnicosColuna([false, false])).toEqual([{ value: "false", label: "Não" }]);
    expect(valoresUnicosColuna([true])).toEqual([{ value: "true", label: "Sim" }]);
  });
  test("preserva números, espaços e distingue nulo de vazio", () => {
    expect(valoresUnicosColuna([0, " 7ª tranche ", null, "", null]).map(v => v.value).sort())
      .toEqual([" 7ª tranche ", "0", FILTRO_VAZIO, FILTRO_NULO].sort());
    expect(valoresUnicosColuna([null, ""], false)).toEqual([]);
  });
  test("seleção filtra exatamente o valor e não usa correspondência parcial", () => {
    const calls: unknown[] = [];
    const q = { eq: (f: string, v: string) => { calls.push(["eq", f, v]); return q; },
      is: (f: string, v: null) => { calls.push(["is", f, v]); return q; } };
    aplicarFiltroColuna(q, "decisao", "SUBSTITUIR");
    aplicarFiltroColuna(q, "nome_cliente_ligado", "Ana_%");
    aplicarFiltroColuna(q, "coordenada_validada", "false");
    aplicarFiltroColuna(q, "decisao", FILTRO_NULO);
    aplicarFiltroColuna(q, "nome_cliente_ligado", FILTRO_VAZIO);
    aplicarFiltroColuna(q, "decisao", "");
    expect(calls).toEqual([["eq", "decisao", "SUBSTITUIR"], ["eq", "nome_cliente_ligado", "Ana_%"],
      ["eq", "coordenada_validada", "false"], ["is", "decisao", null], ["eq", "nome_cliente_ligado", ""]]);
  });
});