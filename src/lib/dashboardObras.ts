export interface QuantitativoDashboard {
  unidade: string;
  meta_programa: number;
  valor_referencia: number;
  quantidade_executada: number;
  vr_previsto: number;
  vr_executado: number;
  percentual_execucao: number;
  saldo_fisico: number;
}

const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

export function normalizarLinha(r: Record<string, unknown>): QuantitativoDashboard {
  return {
    unidade: String(r.unidade ?? ""),
    meta_programa: num(r.meta_programa),
    valor_referencia: num(r.valor_referencia),
    quantidade_executada: num(r.quantidade_executada),
    vr_previsto: num(r.vr_previsto),
    vr_executado: num(r.vr_executado),
    percentual_execucao: num(r.percentual_execucao),
    saldo_fisico: num(r.saldo_fisico),
  };
}

export const isConsumidor = (unidade: string) => /medidor/i.test(unidade);

/** Avanço físico = soma vr_executado / soma vr_previsto (0..1). */
export function avancoFisico(linhas: QuantitativoDashboard[]): number {
  const prev = linhas.reduce((s, l) => s + l.vr_previsto, 0);
  const exec = linhas.reduce((s, l) => s + l.vr_executado, 0);
  return prev > 0 ? exec / prev : 0;
}

export function resumoDashboard(linhas: QuantitativoDashboard[]) {
  const redes = linhas.filter((l) => !isConsumidor(l.unidade));
  const consumidor = linhas.filter((l) => isConsumidor(l.unidade));
  return {
    redes,
    consumidor,
    vrPrevisto: linhas.reduce((s, l) => s + l.vr_previsto, 0),
    vrExecutado: linhas.reduce((s, l) => s + l.vr_executado, 0),
    avancoGeral: avancoFisico(linhas),
    avancoRedes: avancoFisico(redes),
    avancoConsumidor: avancoFisico(consumidor),
  };
}
