// Cores das colunas de Prioritários.
// Regras do usuário:
//  - Tranche: cada tranche tem uma cor própria.
//  - Alocação: LPT 5311 = vermelho, Novos Entrantes = azul.
//  - Coordenada validada: Sim = verde, Não = vermelho.
//  - Decisão: Mantido = verde, Retirado = vermelho, Substituir = laranja.

/** Classe de badge (fundo suave + borda + texto) para um valor. */
export type CorBadge = string;

const VERDE = "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
const VERMELHO = "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300";
const AZUL = "border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-300";
const LARANJA = "border-orange-500/40 bg-orange-500/10 text-orange-700 dark:text-orange-300";

/**
 * Paleta das tranches: evita vermelho, verde e laranja porque essas cores já
 * carregam significado nas colunas Alocação, Coordenada validada e Decisão.
 */
const PALETA_TRANCHES: CorBadge[] = [
  "border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  "border-violet-500/40 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  "border-teal-500/40 bg-teal-500/10 text-teal-700 dark:text-teal-300",
  "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  "border-indigo-500/40 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300",
  "border-cyan-500/40 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
  "border-lime-500/40 bg-lime-500/10 text-lime-700 dark:text-lime-300",
  "border-fuchsia-500/40 bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300",
  "border-purple-500/40 bg-purple-500/10 text-purple-700 dark:text-purple-300",
  "border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300",
];

/** minúsculas, sem acentos e sem separadores: "LPT 5311" -> "lpt5311". */
function normalizar(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

/** Cor da Alocação: LPT 5311 vermelho, Novos Entrantes azul. */
export function corAlocacao(alocacao?: string | null): CorBadge | null {
  if (!alocacao?.trim()) return null;
  const chave = normalizar(alocacao);
  if (chave.includes("lpt5311")) return VERMELHO;
  if (chave.includes("novosentrantes")) return AZUL;
  return null;
}

/** Cor da Coordenada validada: Sim verde, Não vermelho, não informado sem cor. */
export function corCoordenadaValidada(validada?: boolean | null): CorBadge | null {
  if (validada === true) return VERDE;
  if (validada === false) return VERMELHO;
  return null;
}

/** Cor da Decisão: Mantido verde, Retirado vermelho, Substituir laranja. */
export function corDecisao(decisao?: string | null): CorBadge | null {
  if (!decisao?.trim()) return null;
  const chave = normalizar(decisao);
  if (chave === "mantido") return VERDE;
  if (chave === "retirado") return VERMELHO;
  if (chave === "substituir") return LARANJA;
  return null;
}

/**
 * Forma canônica da Decisão, independente da caixa usada no banco
 * ("MANTIDO" -> "Mantido"). Valores desconhecidos são mantidos como estão.
 */
export function canonicalizarDecisao(decisao?: string | null): string | null {
  if (!decisao?.trim()) return null;
  const chave = normalizar(decisao);
  if (chave === "mantido") return "Mantido";
  if (chave === "retirado") return "Retirado";
  if (chave === "substituir") return "Substituir";
  return decisao.trim();
}

/**
 * Monta a consulta de cor por tranche. As tranches conhecidas recebem cores
 * distintas da paleta, em ordem estável (ordenada); valores fora da lista
 * caem em uma cor determinística por hash.
 */
export function criarCorTranche(tranches: readonly string[] = []) {
  const mapa = new Map<string, CorBadge>();
  const ordenadas = [...tranches]
    .filter((t) => t?.trim())
    .sort((a, b) => a.localeCompare(b, "pt-BR", { numeric: true, sensitivity: "base" }));
  ordenadas.forEach((tranche, indice) => {
    mapa.set(normalizar(tranche), PALETA_TRANCHES[indice % PALETA_TRANCHES.length]);
  });

  return (tranche?: string | null): CorBadge | null => {
    if (!tranche?.trim()) return null;
    const chave = normalizar(tranche);
    const cor = mapa.get(chave);
    if (cor) return cor;
    let soma = 0;
    for (let i = 0; i < chave.length; i++) soma = (soma + chave.charCodeAt(i) * (i + 1)) % PALETA_TRANCHES.length;
    return PALETA_TRANCHES[soma];
  };
}
