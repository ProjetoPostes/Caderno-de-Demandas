import { useEffect, useState } from "react";
import { Check, RotateCcw } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAppearance, type Surface } from "@/contexts/AppearanceContext";
import { contraste, rgbHex, rgbHsl, textoLegivel } from "@/lib/contraste";

const items: { surface: Surface; label: string; token: string }[] = [
  { surface: "sidebar", label: "Menu lateral", token: "surface-sidebar-base" },
  { surface: "header", label: "Cabeçalho", token: "theme-topbar" },
  { surface: "cards", label: "Cards", token: "card" },
];

export function AppearanceDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { colors, setColor, reset } = useAppearance();
  const { resolvedTheme } = useTheme();
  const [defaults, setDefaults] = useState<Partial<Record<Surface, string>>>({});

  useEffect(() => {
    if (!open) return;
    const css = getComputedStyle(document.documentElement);
    const read = (token: string, depth = 0): string => {
      if (depth > 8) return "";
      const value = css.getPropertyValue(`--${token}`).trim();
      const variable = value.match(/^var\(--([\w-]+)\)$/);
      return variable ? read(variable[1], depth + 1) : value;
    };
    const next: Partial<Record<Surface, string>> = {};
    for (const item of items) {
      const value = read(item.token) || read("background");
      const rgb = rgbHsl(value);
      next[item.surface] = `#${rgb.map(v => Math.round(v).toString(16).padStart(2, "0")).join("")}`;
    }
    setDefaults(next);
  }, [open, resolvedTheme]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Personalizar cores</DialogTitle>
          <DialogDescription>{({ light: "Claro", dark: "Escuro", holst: "Holst", oceano: "Oceano", artico: "Ártico", lavanda: "Lavanda" } as Record<string, string>)[resolvedTheme ?? "light"]} · Preferência neste navegador</DialogDescription>
        </DialogHeader>
        <div className="divide-y">
          {items.map(({ surface, label }) => {
            const color = colors[surface] ?? defaults[surface];
            const foreground = color ? textoLegivel(rgbHex(color)) : "dark";
            const ratio = color ? contraste(rgbHex(color), foreground === "dark" ? [0, 0, 0] : [255, 255, 255]) : 0;
            return (
              <div key={surface} className="py-4 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor={`color-${surface}`}>{label}</Label>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">{color?.toUpperCase()}</span>
                    <Input id={`color-${surface}`} aria-label={`Cor do ${label.toLowerCase()}`} type="color" value={color ?? "#ffffff"} onChange={event => setColor(surface, event.target.value)} className="h-11 w-14 cursor-pointer p-1" />
                    <Button variant="ghost" size="icon" className="min-h-11 min-w-11" aria-label={`Restaurar cor de ${label.toLowerCase()}`} title="Restaurar cor" disabled={!colors[surface]} onClick={() => reset(surface)}><RotateCcw className="h-4 w-4" /></Button>
                  </div>
                </div>
                {colors[surface] && <p className="flex items-center gap-1 text-xs text-muted-foreground"><Check className="h-3 w-3" /> Contraste AA · {ratio.toFixed(2)}:1</p>}
              </div>
            );
          })}
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="outline" onClick={() => reset()}><RotateCcw className="h-4 w-4 mr-2" /> Restaurar cores do tema</Button>
          <Button onClick={() => onOpenChange(false)}><Check className="h-4 w-4 mr-2" /> Concluir</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}