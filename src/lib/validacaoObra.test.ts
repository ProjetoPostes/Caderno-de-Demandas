import { expect, test } from "bun:test";
import { dadosValidacaoObra } from "./validacaoObra";

test("ODS e Status ODS são dados fixos e não fazem parte da validação enviada", () => {
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