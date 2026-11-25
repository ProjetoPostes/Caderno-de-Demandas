import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useTheme } from "next-themes";
import { hexHsl, rgbHex, textoLegivel } from "@/lib/contraste";

export type Surface = "sidebar" | "header" | "cards";
type Colors = Partial<Record<Surface, string>>;
type Preferences = Record<string, Colors>;
const STORAGE_KEY = "poste-appearance-colors";
const surfaces: Surface[] = ["sidebar", "header", "cards"];

function readPreferences(): Preferences {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    if (!stored || typeof stored !== "object" || Array.isArray(stored)) return {};
    const result: Preferences = {};
    for (const [theme, colors] of Object.entries(stored)) {
      if (!["light", "dark", "holst", "oceano", "artico", "lavanda", "floresta"].includes(theme) || !colors || typeof colors !== "object") continue;
      result[theme] = {};
      for (const surface of surfaces) {
        const color = (colors as Colors)[surface];
        if (typeof color === "string" && /^#[\da-f]{6}$/i.test(color)) result[theme][surface] = color;
      }
    }
    return result;
  } catch { return {}; }
}

const AppearanceContext = createContext<{
  colors: Colors;
  setColor: (surface: Surface, color: string) => void;
  reset: (surface?: Surface) => void;
}>({ colors: {}, setColor: () => {}, reset: () => {} });

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme ?? "light";
  const [preferences, setPreferences] = useState<Preferences>(readPreferences);
  const colors = preferences[theme] ?? {};

  useEffect(() => {
    const root = document.documentElement;
    for (const surface of surfaces) {
      const color = preferences[theme]?.[surface];
      root.toggleAttribute(`data-custom-${surface}`, Boolean(color));
      if (color) {
        root.style.setProperty(`--custom-${surface}`, hexHsl(color));
        root.style.setProperty(`--custom-${surface}-foreground`, `var(--readable-${textoLegivel(rgbHex(color))})`);
      } else {
        root.style.removeProperty(`--custom-${surface}`);
        root.style.removeProperty(`--custom-${surface}-foreground`);
      }
    }
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences)); } catch { /* Browser storage may be unavailable. */ }
  }, [preferences, theme]);

  function setColor(surface: Surface, color: string) {
    if (!/^#[\da-f]{6}$/i.test(color)) return;
    setPreferences(previous => ({ ...previous, [theme]: { ...previous[theme], [surface]: color } }));
  }
  function reset(surface?: Surface) {
    setPreferences(previous => {
      const next = { ...previous[theme] };
      if (surface) delete next[surface];
      return { ...previous, [theme]: surface ? next : {} };
    });
  }
  return <AppearanceContext.Provider value={{ colors, setColor, reset }}>{children}</AppearanceContext.Provider>;
}

export function useAppearance() { return useContext(AppearanceContext); }