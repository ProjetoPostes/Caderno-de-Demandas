export const TRANCHE_OPCOES = ["7ª Tranche", "8ª Tranche", "9ª Tranche", "10ª Tranche"] as const;

export type StatusTranche = "sem_prioritario" | "divergente" | "limite" | "ok";

export interface ResultadoTranche {
  status: StatusTranche;
  bloqueia: boolean;
  mensagem: string;
}

const norm = (t: string | null | undefined) => (t ?? "").trim().toLowerCase();

/**
 * Valida a alteração de tranche de uma OS contra o Prioritário.
 * @param tranchesPrioritario tranches de cada registro do CPF no Prioritário (um item por registro)
 * @param outrasOsNaTranche OSs do mesmo cliente (exceto a atual) já na tranche selecionada
 */
export function avaliarTranche(
  selecionada: string,
  tranchesPrioritario: (string | null)[],
  outrasOsNaTranche: number,
): ResultadoTranche {
  if (tranchesPrioritario.length === 0) {
    return { status: "sem_prioritario", bloqueia: false, mensagem: "Atenção: este CPF não consta no Prioritário. A alteração é permitida." };
  }
  const vagas = tranchesPrioritario.filter((t) => norm(t) === norm(selecionada)).length;
  if (vagas === 0) {
    const outras = [...new Set(tranchesPrioritario.map((t) => t?.trim() || "sem tranche"))].join(", ");
    return { status: "divergente", bloqueia: true, mensagem: `O CPF consta no Prioritário apenas em: ${outras}. Não é permitido alterar para a ${selecionada}.` };
  }
  if (outrasOsNaTranche >= vagas) {
    return { status: "limite", bloqueia: true, mensagem: `Este CPF já possui ${outrasOsNaTranche} OS(s) na ${selecionada}, atingindo o limite de ${vagas} registro(s) no Prioritário.` };
  }
  return { status: "ok", bloqueia: false, mensagem: `Válido: ${outrasOsNaTranche + 1} de ${vagas} vaga(s) utilizada(s) na ${selecionada}.` };
}
