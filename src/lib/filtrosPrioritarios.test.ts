import { expect, test } from "bun:test";
import { aplicarFiltrosPrioritarios, expressaoClientesDaObra } from "./filtrosPrioritarios";
import { FILTRO_EM_BRANCO, FILTRO_PREENCHIDO } from "./valoresColuna";

for (const campo of ["nome_correto", "cpf_correto"]) {
  test(`${campo}: vazio inclui NULL e string vazia`, () => {
    const calls: unknown[] = [];
    const q = { or: (v: string) => { calls.push(v); return q; } };
    aplicarFiltrosPrioritarios(q, { [campo]: FILTRO_EM_BRANCO });
    expect(calls).toEqual([`${campo}.is.null,${campo}.eq.`]);
  });
  test(`${campo}: preenchido exclui NULL e string vazia`, () => {
    const calls: unknown[] = [];
    const q = {
      not: (...args: unknown[]) => { calls.push(args); return q; },
      neq: (...args: unknown[]) => { calls.push(args); return q; },
    };
    aplicarFiltrosPrioritarios(q, { [campo]: FILTRO_PREENCHIDO });
    expect(calls).toEqual([[campo, "is", null], [campo, ""]]);
  });
}

test("obra considera clientes das OS vinculadas, deduplica e permite CPF sem id", () => {
  expect(expressaoClientesDaObra([
    { id_cliente: 42, cliente: { cpf: "12345678901" } },
    { id_cliente: 42, cliente: { cpf: "12345678901" } },
    { id_cliente: 87, cliente: null },
  ])).toBe('id_cliente.in.(42,87),and(id_cliente.is.null,cpf_corrigido.in.("12345678901","123.456.789-01"))');
});

test("obra sem clientes não produz filtro amplo", () => {
  expect(expressaoClientesDaObra([])).toBeNull();
});

test("preserva outros filtros junto com preenchimento", () => {
  const calls: unknown[] = [];
  const q = { eq: (...args: unknown[]) => { calls.push(args); return q; } };
  aplicarFiltrosPrioritarios(q, { tranche: "7ª tranche", decisao: "MANTIDO" });
  expect(calls).toEqual([["tranche", "7ª tranche"], ["decisao", "MANTIDO"]]);
});