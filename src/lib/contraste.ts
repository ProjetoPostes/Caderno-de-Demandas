export type RGB = [number, number, number];

export const CONTRASTE_TEXTO = 4.5;
export const CONTRASTE_DESTAQUE = 3;

export function rgbHex(hex: string): RGB {
  if (!/^#[\da-f]{6}$/i.test(hex)) throw new Error("Cor inválida");
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
}

export function rgbHsl(value: string): RGB {
  const [h, s, l] = value.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? [];
  if (h === undefined || s === undefined || l === undefined) throw new Error("HSL inválido");
  const saturation = s / 100;
  const lightness = l / 100;
  const a = saturation * Math.min(lightness, 1 - lightness);
  const channel = (n: number) => {
    const k = (n + h / 30) % 12;
    return 255 * (lightness - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)));
  };
  return [channel(0), channel(8), channel(4)];
}

export function contraste(a: RGB, b: RGB): number {
  const luminance = (rgb: RGB) => {
    const linear = rgb.map(value => {
      const channel = value / 255;
      return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    });
    return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
  };
  const l1 = luminance(a);
  const l2 = luminance(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

export function textoLegivel(background: RGB): "dark" | "light" {
  return contraste(background, [0, 0, 0]) >= CONTRASTE_TEXTO ? "dark" : "light";
}

export function hexHsl(hex: string): string {
  const [r, g, b] = rgbHex(hex).map(v => v / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const delta = max - min, l = (max + min) / 2;
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
  const hue = delta === 0 ? 0 : max === r ? ((g - b) / delta) % 6 : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4;
  return `${(hue * 60 + 360) % 360} ${s * 100}% ${l * 100}%`;
}