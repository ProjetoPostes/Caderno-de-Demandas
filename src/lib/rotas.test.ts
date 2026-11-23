import { describe, expect, it } from "bun:test";
import { rotaObra } from "./rotas";

describe("rotaObra", () => {
  it("monta a rota da tela da obra a partir do id", () => {
    expect(rotaObra(5808)).toBe("/obras/5808");
  });

  it("retorna null quando a OS não tem obra vinculada", () => {
    expect(rotaObra(null)).toBeNull();
    expect(rotaObra(undefined)).toBeNull();
    expect(rotaObra(Number.NaN)).toBeNull();
  });
});
