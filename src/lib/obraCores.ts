// Cores das colunas da tabela de Obras: pílulas sólidas, uma cor por situação.
// Os 7 slots são tokens do tema (--pill-1 ... --pill-7 em index.css), então a
// paleta acompanha Holst, Oceano, Ártico, Lavanda e o tema escuro.

export const SLOTS_PILHA = ["pill-1", "pill-2", "pill-3", "pill-4", "pill-5", "pill-6", "pill-7"] as const;
export type SlotPilha = (typeof SLOTS_PILHA)[number];

/**
 * Classes de cada slot. Escritas por extenso de propósito: o Tailwind só gera
 * utilitários que aparecem literalmente no código, então nada de `bg-${slot}`.
 */
const CLASSES_PILHA: Record<SlotPilha, string> = {
  "pill-1": "bg-pill-1 text-pill-1-foreground",
  "pill-2": "bg-pill-2 text-pill-2-foreground",
  "pill-3": "bg-pill-3 text-pill-3-foreground",
  "pill-4": "bg-pill-4 text-pill-4-foreground",
  "pill-5": "bg-pill-5 text-pill-5-foreground",
  "pill-6": "bg-pill-6 text-pill-6-foreground",
  "pill-7": "bg-pill-7 text-pill-7-foreground",
};

/** Fundo sólido + texto legível do slot, ambos do tema ativo. */
export function classePilha(slot: SlotPilha): string {
  return CLASSES_PILHA[slot];
}

const INFO: SlotPilha = "pill-1";
const OK: SlotPilha = "pill-2";
const ALERTA: SlotPilha = "pill-3";
const ERRO: SlotPilha = "pill-4";
const NEUTRO: SlotPilha = "pill-7";

/** Slots usados por valores sem significado próprio (etapas, códigos, ODS). */
const CATEGORIAS: SlotPilha[] = ["pill-5", "pill-6", "pill-7", "pill-1"];

/** minúsculas, sem acentos e sem separadores: "Em Análise" -> "emanalise". */
function normalizar(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

const PALAVRAS_ERRO = [
  "impedida", "impedido", "cancelada", "cancelado", "reprovada", "reprovado",
  "negada", "negado", "invalida", "invalido", "encerrada", "encerrado", "nao",
];
const PALAVRAS_OK = [
  "executada", "executado", "concluida", "concluido", "aprovada", "aprovado",
  "valida", "valido", "regular", "finalizada", "finalizado", "ativa", "sim",
];
const PALAVRAS_ALERTA = [
  "pendente", "aguardando", "analise", "andamento", "execucao", "parcial",
  "aberta", "aberto", "planejamento", "embranco", "noinicio",
];

function contem(chave: string, palavras: readonly string[]): boolean {
  return palavras.some((p) => chave === p || chave.includes(p));
}

/**
 * Cor semântica de um valor: verde para situação resolvida, âmbar para
 * pendência, vermelho para bloqueio. Valores sem palavra reconhecida recebem
 * uma cor determinística por hash, estável entre recarregamentos.
 */
export function corSemantica(valor?: string | number | null): string | null {
  if (valor === null || valor === undefined || String(valor).trim() === "") return null;
  const chave = normalizar(String(valor));
  if (contem(chave, PALAVRAS_ERRO)) return classePilha(ERRO);
  if (contem(chave, PALAVRAS_OK)) return classePilha(OK);
  if (contem(chave, PALAVRAS_ALERTA)) return classePilha(ALERTA);
  return classePilha(slotPorHash(chave));
}

/** Cor determinística apenas por valor, para colunas sem significado (ODS, códigos). */
export function corPorValor(valor?: string | number | null): string | null {
  if (valor === null || valor === undefined || String(valor).trim() === "") return null;
  return classePilha(slotPorHash(normalizar(String(valor))));
}

/** Pílula da contagem de OSs: destacada quando há OS vinculada. */
export function corContagemOs(qtd?: number | null): string {
  return classePilha((qtd ?? 0) > 0 ? INFO : NEUTRO);
}

function slotPorHash(chave: string): SlotPilha {
  let soma = 0;
  for (let i = 0; i < chave.length; i++) soma = (soma + chave.charCodeAt(i) * (i + 1)) % CATEGORIAS.length;
  return CATEGORIAS[soma];
}
