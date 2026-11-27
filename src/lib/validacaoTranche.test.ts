import { describe, expect, test } from "bun:test";
import { avaliarTranche } from "./validacaoTranche";

describe("avaliarTranche", () => {
  test("CPF fora do Prioritário: permite com aviso", () => {
    const r = avaliarTranche("7ª Tranche", [], 0);
    expect(r.status).toBe("sem_prioritario");
    expect(r.bloqueia).toBe(false);
  });
  test("CPF só em outra tranche: bloqueia", () => {
    const r = avaliarTranche("7ª Tranche", ["8ª Tranche"], 0);
    expect(r.status).toBe("divergente");
    expect(r.bloqueia).toBe(true);
  });
  test("OSs já ocupam todas as vagas da tranche: bloqueia", () => {
    const r = avaliarTranche("8ª Tranche", ["8ª Tranche", "8ª Tranche"], 2);
    expect(r.status).toBe("limite");
    expect(r.bloqueia).toBe(true);
  });
  test("há vaga na tranche: permite", () => {
    const r = avaliarTranche("8ª Tranche", ["8ª Tranche", "8ª Tranche", "9ª Tranche"], 1);
    expect(r.status).toBe("ok");
    expect(r.bloqueia).toBe(false);
  });
});
