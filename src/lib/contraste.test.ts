import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { CONTRASTE_TEXTO, contraste, hexHsl, rgbHex, rgbHsl, textoLegivel } from "./contraste";

const css = readFileSync(new URL("../index.css", import.meta.url), "utf8");
function tokens(selector: string): Record<string, string> {
  const block = css.slice(css.indexOf(`${selector} {`)).split("}")[0];
  return Object.fromEntries([...block.matchAll(/--([\w-]+):\s*([^;]+);/g)].map(match => [match[1], match[2].trim()]));
}
function resolve(values: Record<string, string>, key: string): string {
  const value = values[key];
  if (!value) throw new Error(`Missing token ${key}`);
  const variable = value.match(/^var\(--([\w-]+)\)$/);
  return variable ? resolve(values, variable[1]) : value;
}

describe("Contraste WCAG AA", () => {
  test("texto normal exige no mínimo 4.5:1", () => {
    expect(CONTRASTE_TEXTO).toBe(4.5);
    expect(contraste([255, 255, 255], [0, 0, 0])).toBe(21);
    expect(contraste([128, 128, 128], [128, 128, 128])).toBe(1);
  });
  for (const theme of ["holst", "oceano"]) {
    const values = { ...tokens(":root"), ...tokens(`.${theme}`) };
    const pairs = [
      ["background", "foreground"], ["card", "card-foreground"], ["card", "muted-foreground"],
      ["muted", "muted-foreground"], ["primary", "primary-foreground"], ["secondary", "secondary-foreground"],
      ["accent", "accent-foreground"], ["destructive", "destructive-foreground"], ["success", "success-foreground"],
      ["popover", "popover-foreground"], ["sidebar", "sidebar-foreground"],
      ["sidebar-accent", "sidebar-accent-foreground"], ["sidebar-primary", "sidebar-primary-foreground"],
      ["theme-header", "theme-header-foreground"], ["theme-topbar", "theme-topbar-foreground"],
      ["theme-table-header", "theme-table-header-foreground"], ["theme-complement", "theme-complement-foreground"],
      ["theme-highlight", "theme-highlight-foreground"], ["theme-row-hover", "foreground"],
    ];
    for (const [background, foreground] of pairs) {
      test(`${theme}: ${foreground} sobre ${background} ≥ 4.5:1`, () => {
        expect(contraste(rgbHsl(resolve(values, background)), rgbHsl(resolve(values, foreground)))).toBeGreaterThanOrEqual(4.5);
      });
    }
  }
  test("cores personalizadas sempre recebem texto legível", () => {
    for (let r = 0; r <= 255; r += 17) for (let g = 0; g <= 255; g += 17) for (let b = 0; b <= 255; b += 17) {
      const background: [number, number, number] = [r, g, b];
      const foreground = textoLegivel(background) === "dark" ? [0, 0, 0] as [number, number, number] : [255, 255, 255] as [number, number, number];
      expect(contraste(background, foreground)).toBeGreaterThanOrEqual(4.5);
    }
  });
  test("conversão preserva as cores selecionadas", () => {
    for (const hex of ["#ffffff", "#000000", "#415a77", "#b3cfe5", "#ff0044"]) {
      expect(rgbHsl(hexHsl(hex)).map(Math.round)).toEqual(rgbHex(hex));
    }
  });
});