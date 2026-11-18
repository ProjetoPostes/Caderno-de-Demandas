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