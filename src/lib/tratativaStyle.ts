import type { CSSProperties } from "react";

const TRATATIVA_COLORS: Record<string, { bg: string; text: string }> = {
  Levantamento:  { bg: "#ed8002", text: "#ffffff" },
  Transformada:  { bg: "#fed50b", text: "#000000" },
  Pendente:      { bg: "#ffffff", text: "#000000" },
  Impedida:      { bg: "#da0101", text: "#ffffff" },
  Redirecionada: { bg: "#1873b9", text: "#ffffff" },
  Cancelada:     { bg: "#c414f5", text: "#ffffff" },
  Executada:     { bg: "#23a43a", text: "#ffffff" },
};

export function getTratativaStyle(tratativa: string | null | undefined): CSSProperties {
  if (!tratativa) return {};
  const colors = TRATATIVA_COLORS[tratativa];
  if (!colors) return {};
  return {
    backgroundColor: colors.bg,
    color: colors.text,
    borderColor: colors.bg,
  };
}
