/// <reference types="bun" />
import { expect, test } from "bun:test";
import { podeEditarCoordenadas } from "./prioritarioValidation";

test("Não habilita edição das coordenadas", () => {
  expect(podeEditarCoordenadas(false)).toBe(true);
});

test("Sim ou não informado mantém coordenadas somente leitura", () => {
  expect(podeEditarCoordenadas(true)).toBe(false);
  expect(podeEditarCoordenadas(null)).toBe(false);
  expect(podeEditarCoordenadas(undefined)).toBe(false);
});
import { cpfValido, validarCorrecao } from "./prioritarioValidation";

const base = { "Responsável": "Ana", coordenada_validada: true };

test("Aceita CPF válido e rejeita inválido", () => {
  expect(cpfValido("529.982.247-25")).toBe(true);
  expect(cpfValido("111.111.111-11")).toBe(false);
  expect(validarCorrecao({ ...base, cpf_correto: "123" }).erros.cpf_correto).toBe("CPF inválido");
});

test("Exige responsável e coordenada validada", () => {
  const { erros } = validarCorrecao({});
  expect(Object.keys(erros).sort()).toEqual(["Responsável", "coordenada_validada"]);
});

test("Com coordenada Não, exige coordenadas válidas e envia com ponto", () => {
  expect(validarCorrecao({ ...base, coordenada_validada: false, latitude: "95", longitude: "-48,9" }).erros.latitude).toBeDefined();
  const r = validarCorrecao({ ...base, coordenada_validada: false, latitude: "-5,123456", longitude: "-48,987654" });
  expect(r.erros).toEqual({});
  expect(r.payload.latitude).toBe("-5.123456");
  expect(r.payload.longitude).toBe("-48.987654");
});

test("Com coordenada Sim, não altera coordenadas", () => {
  expect("latitude" in validarCorrecao({ ...base, latitude: "1" }).payload).toBe(false);
});
