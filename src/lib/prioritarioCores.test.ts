/// <reference types="bun" />
import { describe, expect, test } from "bun:test";
import { criarCorTranche, corAlocacao, corCoordenadaValidada, corDecisao } from "./prioritarioCores";

describe("corAlocacao", () => {
  test("LPT 5311 é vermelho", () => {
    expect(corAlocacao("LPT 5311")).toContain("bg-red");
    expect(corAlocacao("lpt 5311")).toContain("bg-red");
  });

  test("Novos Entrantes é azul", () => {
    expect(corAlocacao("Novos Entrantes")).toContain("bg-blue");
    expect(corAlocacao("NOVOS ENTRANTES")).toContain("bg-blue");
  });

  test("alocação desconhecida ou vazia não tem cor", () => {
    expect(corAlocacao("Outra alocação")).toBeNull();
    expect(corAlocacao("")).toBeNull();
    expect(corAlocacao(null)).toBeNull();
  });
});

describe("corCoordenadaValidada", () => {
  test("Sim é verde e Não é vermelho", () => {
    expect(corCoordenadaValidada(true)).toContain("bg-emerald");
    expect(corCoordenadaValidada(false)).toContain("bg-red");
  });

  test("não informado não tem cor", () => {
    expect(corCoordenadaValidada(null)).toBeNull();
    expect(corCoordenadaValidada(undefined)).toBeNull();
  });
});

describe("corDecisao", () => {
  test("Mantido verde, Retirado vermelho, Substituir laranja", () => {
    expect(corDecisao("Mantido")).toContain("bg-emerald");
    expect(corDecisao("Retirado")).toContain("bg-red");
    expect(corDecisao("Substituir")).toContain("bg-orange");
  });

  test("decisão vazia ou desconhecida não tem cor", () => {
    expect(corDecisao("")).toBeNull();
    expect(corDecisao(null)).toBeNull();
    expect(corDecisao("Talvez")).toBeNull();
  });
});

describe("criarCorTranche", () => {
  const cor = criarCorTranche(["5ª tranche", "6ª tranche", "7ª tranche"]);

  test("cada tranche recebe cor diferente", () => {
    const cores = ["5ª tranche", "6ª tranche", "7ª tranche"].map((t) => cor(t));
    expect(new Set(cores).size).toBe(3);
  });

  test("a mesma tranche sempre recebe a mesma cor", () => {
    expect(cor("7ª tranche")).toBe(cor("7ª tranche"));
  });

  test("tranche fora da lista recebe cor determinística", () => {
    const fora = cor("99ª tranche");
    expect(fora).not.toBeNull();
    expect(fora).toBe(cor("99ª tranche"));
  });

  test("tranche vazia não tem cor", () => {
    expect(cor("")).toBeNull();
    expect(cor(null)).toBeNull();
  });
});
