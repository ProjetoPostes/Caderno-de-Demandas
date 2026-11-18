/// <reference types="bun" />
import { describe, expect, test } from "bun:test";
import { localizarCoordenadas, validarTipoCoordenada } from "./analiseCoordenadas";

const base = { tipo_coordenada: "graus_decimais", fuso_utm: "", hemisferio_utm: "", coordenada_x_solicitacao: "-5,123456", coordenada_y_solicitacao: "-48,987654" };
describe("coordenadas da análise", () => {
  test("tipo obrigatório", () => expect(validarTipoCoordenada({ ...base, tipo_coordenada: "" })).toBe("Selecione o tipo de coordenada."));
  test("UTM exige fuso", () => expect(validarTipoCoordenada({ ...base, tipo_coordenada: "utm" })).toBe("Informe um fuso UTM inteiro de 1 a 60."));
  test("UTM exige hemisfério", () => expect(validarTipoCoordenada({ ...base, tipo_coordenada: "utm", fuso_utm: "22" })).toBe("Selecione o hemisfério UTM."));
  test("fuso entre 1 e 60", () => {
    for (const fuso_utm of ["0", "61", "22.5"]) expect(validarTipoCoordenada({ ...base, tipo_coordenada: "utm", fuso_utm, hemisferio_utm: "S" })).not.toBeNull();
  });
  test("graus decimais dispensam fuso e hemisfério e usam ponto nos links", () => {
    expect(validarTipoCoordenada(base)).toBeNull();
    const ponto = localizarCoordenadas(base);
    expect(ponto.latitude).toBe(-5.123456);
    expect(ponto.mapsUrl).toContain("-5.123456%2C-48.987654");
    expect(ponto.earthUrl).toContain("@-5.123456,-48.987654,");
  });
  test("converte UTM sul X leste Y norte", () => {
    const ponto = localizarCoordenadas({ ...base, tipo_coordenada: "utm", fuso_utm: "22", hemisferio_utm: "S", coordenada_x_solicitacao: "500000", coordenada_y_solicitacao: "9000000" });
    expect(ponto.longitude).toBeCloseTo(-51, 6);
    expect(ponto.latitude).toBeCloseTo(-9.046562, 5);
  });
  test("converte UTM norte", () => {
    const ponto = localizarCoordenadas({ ...base, tipo_coordenada: "utm", fuso_utm: "22", hemisferio_utm: "N", coordenada_x_solicitacao: "500000", coordenada_y_solicitacao: "1000000" });
    expect(ponto.latitude).toBeCloseTo(9.046562, 5);
  });
  test("rejeita coordenadas vazias e fora da faixa", () => {
    expect(() => localizarCoordenadas({ ...base, coordenada_x_solicitacao: "" })).toThrow();
    expect(() => localizarCoordenadas({ ...base, coordenada_x_solicitacao: "91" })).toThrow();
  });
});