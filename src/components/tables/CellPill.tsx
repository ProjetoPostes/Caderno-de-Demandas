import { ReactNode } from "react";
import { cn } from "@/lib/utils";

function estaVazio(value: ReactNode): boolean {
  return value === null || value === undefined || value === "" || value === "-";
}

/** Pílula sólida de status: fundo do tema, texto em caixa alta e mais visível. */
export function CellPill({ value, tone, className }: { value?: ReactNode; tone?: string | null; className?: string }) {
  const vazio = estaVazio(value);
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center rounded-full px-2.5 py-1 text-xs font-bold uppercase leading-none tracking-wide ring-1 ring-inset ring-foreground/10",
        vazio || !tone ? "bg-muted text-muted-foreground ring-transparent" : tone,
        className,
      )}
    >
      {vazio ? "-" : value}
    </span>
  );
}

/** Caixa discreta para códigos e números (mono, em destaque sobre o card). */
export function CellChip({ value, className }: { value?: ReactNode; className?: string }) {
  const vazio = estaVazio(value);
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center rounded-md bg-muted px-2 py-1 font-mono text-xs font-bold leading-none text-foreground",
        vazio && "font-normal text-muted-foreground",
        className,
      )}
    >
      {vazio ? "-" : value}
    </span>
  );
}
