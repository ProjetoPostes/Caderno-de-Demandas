import { describe, expect, test } from "bun:test";
import fundoArtico from "../assets/fundo-artico.webp";
import fundoLuzParaTodos from "../assets/fundo-luz-para-todos.webp";
import { fundoDoTema } from "./fundoHub";

describe("Arte de fundo do MainHub por tema", () => {
  test("o tema Ártico usa a própria arte, em azul", () => {
    const fundo = fundoDoTema("artico");
    expect(fundo.imagem).toBe(fundoArtico);
    expect(fundo.corBase).toBe("#C4E1FA");
    // A logo e a paisagem ficam no lado direito da arte: o recorte sai da esquerda.
    expect(fundo.posicao).toBe("right top");
  });

  test("os demais temas usam a arte padrão do Luz para Todos", () => {
    for (const theme of ["light", "dark", "holst", "oceano", "lavanda", "floresta"]) {
      const fundo = fundoDoTema(theme);
      expect(fundo.imagem).toBe(fundoLuzParaTodos);
      expect(fundo.corBase).toBe("#EAF4FC");
      expect(fundo.posicao).toBe("center top");
    }
  });

  test("sem tema definido ainda cai na arte padrão", () => {
    expect(fundoDoTema(undefined).imagem).toBe(fundoLuzParaTodos);
  });
});
