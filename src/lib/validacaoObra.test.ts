import { expect, test } from "bun:test";
import { dadosValidacaoObra } from "./validacaoObra";

test("Edição de ODS e Status ODS apenas na interface não altera a validação enviada", () => {
  const dados = dadosValidacaoObra({
    tipo_atendimento: "Melhoria",
    analise_obra: "Análise",
    cadastro_enbpar: "Pendente",
    check_txt: "Sim",
    ...{ ods: "12345", status_ods: "Concluída" },
  });
  expect(dados).not.toHaveProperty("ods");
  expect(dados).not.toHaveProperty("status_ods");
  expect(dados.analise_obra).toBe("Análise");
});

test("a validação envia o usuário escolhido como responsável", () => {
  const dados = dadosValidacaoObra({
    tipo_atendimento: null,
    analise_obra: "Análise",
    cadastro_enbpar: null,
    check_txt: null,
    responsavel: "Ana Silva",
  });
  expect(dados.responsavel).toBe("Ana Silva");
});