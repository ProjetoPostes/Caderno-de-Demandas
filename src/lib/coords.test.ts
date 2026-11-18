/// <reference types="bun" />
import { describe, expect, test } from "bun:test";
import { coordsDoMapa, fmtCoord } from "./coords";

describe("fmtCoord", () => {
  test("mantém o ponto decimal de números e strings", () => {
    expect(fmtCoord(-5.123456)).toBe("-5.123456");
    expect(fmtCoord("-48.987654")).toBe("-48.987654");
  });

  test("troca vírgula decimal por ponto", () => {
    expect(fmtCoord("-5,123456")).toBe("-5.123456");
    expect(fmtCoord("-48,987654")).toBe("-48.987654");
  });

  test("remove espaços e trata milhares", () => {
    expect(fmtCoord(" -5,123456 ")).toBe("-5.123456");
    expect(fmtCoord("-1.234,56")).toBe("-1234.56");
    expect(fmtCoord("-1,234.56")).toBe("-1234.56");
  });

  test("retorna vazio para coordenada ausente", () => {
    expect(fmtCoord(null)).toBe("");
    expect(fmtCoord(undefined)).toBe("");
    expect(fmtCoord("")).toBe("");
  });
});

describe("coordsDoMapa", () => {
  test("monta o link com ponto decimal e vírgula entre as coordenadas", () => {
    const mapa = coordsDoMapa("-5,123456", "-48,987654");
    expect(mapa?.url).toBe("https://www.google.com/maps?q=-5.123456%2C-48.987654");
    expect(mapa?.texto).toBe("-5.123456, -48.987654");
  });

  test("aceita números normais", () => {
    const mapa = coordsDoMapa(-5.123456, -48.987654);
    expect(mapa?.url).toBe("https://www.google.com/maps?q=-5.123456%2C-48.987654");
  });

  test("retorna null quando falta uma coordenada", () => {
    expect(coordsDoMapa("-5,123456", null)).toBeNull();
    expect(coordsDoMapa("", "-48,987654")).toBeNull();
  });
});
