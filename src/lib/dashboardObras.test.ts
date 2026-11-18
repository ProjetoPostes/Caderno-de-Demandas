/// <reference types="bun" />
import { describe, expect, it } from "bun:test";
import { avancoFisico, normalizarLinha, resumoDashboard } from "./dashboardObras";

const linhas = [
  { unidade: "Medidor Monofásico - 40 A com poste", meta_programa: "1162", valor_referencia: "1", quantidade_executada: "20", vr_previsto: "1162", vr_executado: "20" },
  { unidade: "Poste", meta_programa: 5982, valor_referencia: 30, quantidade_executada: 0, vr_previsto: 179460, vr_executado: 0 },
  { unidade: "Transformador", vr_previsto: 1000, vr_executado: 500 },
].map(normalizarLinha);

describe("avanço físico", () => {
  it("é vr_executado total / vr_previsto total", () => {
    expect(avancoFisico(linhas)).toBeCloseTo(520 / 181622, 10);
  });
  it("é 0 sem vr_previsto", () => {
    expect(avancoFisico([])).toBe(0);
  });
  it("separa medidor como consumidor", () => {
    const r = resumoDashboard(linhas);
    expect(r.consumidor.length).toBe(1);
    expect(r.avancoConsumidor).toBeCloseTo(20 / 1162, 10);
    expect(r.avancoRedes).toBeCloseTo(500 / 180460, 10);
  });
});
