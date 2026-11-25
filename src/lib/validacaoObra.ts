export interface CamposValidacaoObra {
  tipo_atendimento: string | null;
  analise_obra: string | null;
  cadastro_enbpar: string | null;
  check_txt: string | null;
  responsavel?: string | null;
}

export function dadosValidacaoObra(campos: CamposValidacaoObra) {
  return {
    tipo_atendimento: campos.tipo_atendimento,
    analise_obra: campos.analise_obra,
    cadastro_enbpar: campos.cadastro_enbpar,
    check_txt: campos.check_txt,
    responsavel: campos.responsavel ?? null,
  };
}