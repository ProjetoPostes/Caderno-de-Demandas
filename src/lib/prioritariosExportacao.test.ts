import { describe, expect, test } from "bun:test";
import { prioritarioParaPlanilha } from "./prioritariosExportacao";
import type { Prioritario } from "@/types/database";

const base: Prioritario = {
  id: "prio-1",
  id_cliente: 42,
  nome: "Maria da Silva",
  cpf_corrigido: "01234567890",
  observacao: "Observação da equipe",
  created_at: "2026-11-26T10:00:00Z",
  updated_at: "2026-11-26T11:00:00Z",
};

describe("exportação dos prioritários", () => {
  test("preserva o CPF completo e converte validações para Sim ou Não", () => {
    const linha = prioritarioParaPlanilha({
      ...base,
      coordenada_validada: false,
      cpf_alterado: true,
      nome_alterado: false,
      municipio_alterado: null,
    } as Prioritario);

    expect(linha["CPF"]).toBe("01234567890");
    expect(linha["Coordenada validada"]).toBe("Não");
    expect(linha["CPF alterado?"]).toBe("Sim");
    expect(linha["Nome alterado?"]).toBe("Não");
    expect(linha["Município alterado?"]).toBe("");
  });

  test("exporta os campos principais e a decisão no formato exibido", () => {
    const linha = prioritarioParaPlanilha({
      ...base,
      controle: "CT-001",
      tranche: "7ª tranche",
      alocacao: "NOVOS ENTRANTES",
      decisao: "MANTIDO",
      "Responsável": "Ana Souza",
      latitude: "-15.123456",
      longitude: "-47.654321",
      latitude_enbpar: "-15.999999",
      longitude_enbpar: "-47.999999",
    } as Prioritario);

    expect(linha).toMatchObject({
      "Controle": "CT-001",
      "Cliente": "Maria da Silva",
      "Tranche": "7ª tranche",
      "Alocação": "NOVOS ENTRANTES",
      "Decisão": "Mantido",
      "Responsável": "Ana Souza",
      "Latitude": "-15.123456",
      "Longitude": "-47.654321",
      "Latitude ENBPAR": "-15.999999",
      "Longitude ENBPAR": "-47.999999",
    });
  });
});
