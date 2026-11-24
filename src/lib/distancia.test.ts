import { expect, test } from "bun:test";
import { distanciaMetros } from "./analiseCoordenadas";
test("mesmo ponto tem distância zero", () => { expect(distanciaMetros(-5, -48, -5, -48)).toBe(0); });
test("1 grau de latitude ≈ 111 km", () => { expect(Math.round(distanciaMetros(0, 0, 1, 0) / 1000)).toBe(111); });
