import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { CONTRASTE_TEXTO, contraste, rgbHsl } from "./contraste";
import { classePilha, corContagemOs, corPorValor, corSemantica, SLOTS_PILHA } from "./obraCores";

const css = readFileSync(new URL("../index.css", import.meta.url), "utf8");
function tokens(selector: string): Record<string, string> {
  const block = css.slice(css.indexOf(`${selector} {`)).split("}")[0];
  return Object.fromEntries([...block.matchAll(/--([\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
}
function resolve(values: Record<string, string>, key: string): string {
  const value = values[key];
  if (!value) throw new Error(`Missing token ${key}`);
  const variable = value.match(/^var\(--([\w-]+)\)$/);
  return variable ? resolve(values, variable[1]) : value;
}

const TEMAS: [string, Record<string, string>][] = [
  ["claro", tokens(":root")],
  ["escuro", { ...tokens(":root"), ...tokens(".dark") }],
  ["holst", { ...tokens(":root"), ...tokens(".holst") }],
  ["oceano", { ...tokens(":root"), ...tokens(".oceano") }],
  ["artico", { ...tokens(":root"), ...tokens(".artico") }],
  ["lavanda", { ...tokens(":root"), ...tokens(".lavanda") }],
];

describe("Pílulas das tabelas: contraste", () => {
  for (const [nome, valores] of TEMAS) {
    for (const slot of SLOTS_PILHA) {
      test(`${nome}: ${slot} tem texto legível (≥ 4.5:1)`, () => {
        const fundo = rgbHsl(resolve(valores, slot));
        const frente = rgbHsl(resolve(valores, `${slot}-foreground`));
        expect(contraste(fundo, frente)).toBeGreaterThanOrEqual(CONTRASTE_TEXTO);
      });
    }
  }
});

describe("Pílulas das tabelas: cores por situação", () => {
  test("situação resolvida fica verde e bloqueio fica vermelho", () => {
    expect(corSemantica("EXECUTADA")).toBe(classePilha("pill-2"));
    expect(corSemantica("Aprovada")).toBe(classePilha("pill-2"));
    expect(corSemantica("IMPEDIDA")).toBe(classePilha("pill-4"));
    expect(corSemantica("Cancelada")).toBe(classePilha("pill-4"));
  });

  test("pendência fica em âmbar", () => {
    expect(corSemantica("Pendente")).toBe(classePilha("pill-3"));
    expect(corSemantica("Em Análise")).toBe(classePilha("pill-3"));
  });

  test("caixa alta, acentos e espaços não mudam a cor", () => {
    expect(corSemantica("impedida")).toBe(corSemantica("IMPEDIDA"));
    expect(corSemantica("em analise")).toBe(corSemantica("Em Análise"));
  });

  test("valor vazio não recebe cor", () => {
    expect(corSemantica(null)).toBeNull();
    expect(corSemantica("   ")).toBeNull();
    expect(corPorValor(undefined)).toBeNull();
  });

  test("valores sem palavra reconhecida têm cor estável", () => {
    const primeira = corSemantica("ETAPA-7");
    expect(primeira).toBe(corSemantica("ETAPA-7"));
    expect(SLOTS_PILHA.some((s) => primeira === classePilha(s))).toBe(true);
  });

  test("ODS usa cor apenas por valor, repetível", () => {
    expect(corPorValor("3")).toBe(corPorValor("3"));
    expect(corPorValor(3)).toBe(corPorValor("3"));
  });

  test("contagem de OSs destaca obras com OS", () => {
    expect(corContagemOs(4)).toBe(classePilha("pill-1"));
    expect(corContagemOs(0)).toBe(classePilha("pill-7"));
    expect(corContagemOs(null)).toBe(classePilha("pill-7"));
  });

  test("as sete cores são diferentes entre si no tema claro", () => {
    const rgb = SLOTS_PILHA.map((slot) => rgbHsl(resolve(tokens(":root"), slot)).map(Math.round));
    expect(new Set(rgb.map(String)).size).toBe(SLOTS_PILHA.length);
  });

  test("cada cor está escrita por extenso no código, senão o Tailwind não gera a classe", () => {
    const fonte = readFileSync(new URL("./obraCores.ts", import.meta.url), "utf8");
    for (const slot of SLOTS_PILHA) {
      expect(fonte).toContain(`bg-${slot} text-${slot}-foreground`);
    }
  });

  test("cada cor existe no tailwind.config, senão bg-pill-N não existe na tela", () => {
    const config = readFileSync(new URL("../../tailwind.config.ts", import.meta.url), "utf8");
    for (const slot of SLOTS_PILHA) {
      expect(config).toContain(`'${slot}': 'hsl(var(--${slot}))'`);
      expect(config).toContain(`'${slot}-foreground': 'hsl(var(--${slot}-foreground))'`);
    }
  });
});
