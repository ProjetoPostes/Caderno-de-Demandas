import type { Prioritario } from "@/types/database";
import { canonicalizarDecisao } from "@/lib/prioritarioCores";

function valorPlanilha(valor: unknown): string | number {
  if (valor === null || valor === undefined) return "";
  if (typeof valor === "boolean") return valor ? "Sim" : "Não";
  if (typeof valor === "number") return valor;
  return String(valor);
}

/** Converte um registro em colunas legíveis, mantendo CPF e coordenadas como texto. */
export function prioritarioParaPlanilha(prioritario: Prioritario): Record<string, unknown> {
  const p = prioritario as Prioritario & Record<string, unknown>;
  const decisao = p.decisao == null || p.decisao === "" ? "" : canonicalizarDecisao(String(p.decisao));

  return {
    "ID": valorPlanilha(p.id),
    "ID do cliente": valorPlanilha(p.id_cliente),
    "Controle": valorPlanilha(p.controle),
    "Cliente": valorPlanilha(p.nome),
    "CPF": valorPlanilha(p.cpf_corrigido),
    "Tranche": valorPlanilha(p.tranche),
    "Alocação": valorPlanilha(p.alocacao),
    "Coordenada validada": valorPlanilha(p.coordenada_validada),
    "Decisão": decisao,
    "Responsável": valorPlanilha(p["Responsável"]),
    "Atendimento": valorPlanilha(p.atendimento),
    "CPF correto": valorPlanilha(p.cpf_correto),
    "CPF alterado?": valorPlanilha(p.cpf_alterado),
    "Nome correto": valorPlanilha(p.nome_correto),
    "Nome alterado?": valorPlanilha(p.nome_alterado),
    "Nome do município correto": valorPlanilha(p.nome_municipio_correto),
    "Município alterado?": valorPlanilha(p.municipio_alterado),
    "Nome do cliente ligado": valorPlanilha(p.nome_cliente_ligado),
    "Endereço": valorPlanilha(p.endereco),
    "Latitude": valorPlanilha(p.latitude),
    "Longitude": valorPlanilha(p.longitude),
    "Latitude ENBPAR": valorPlanilha(p.latitude_enbpar),
    "Longitude ENBPAR": valorPlanilha(p.longitude_enbpar),
    "Município da coordenada": valorPlanilha(p.municipio_coord),
    "Identificação": valorPlanilha(p.identificacao),
    "Critério": valorPlanilha(p.criterio),
    "Check PO": valorPlanilha(p.check_po),
    "Motivo do impedimento": valorPlanilha(p.motivo_impedimento),
    "Manter / Retirar": valorPlanilha(p.manter_retirar),
    "Observação": valorPlanilha(p.observacao),
    "Criado em": valorPlanilha(p.created_at),
    "Atualizado em": valorPlanilha(p.updated_at),
  };
}
