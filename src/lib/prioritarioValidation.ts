import { fmtCoord } from "./coords";

export function podeEditarCoordenadas(validada: boolean | null | undefined): boolean {
  return validada === false;
}

export function cpfValido(valor: string): boolean {
  const d = valor.replace(/\D/g, "");
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const dig = (n: number) => {
    let s = 0;
    for (let i = 0; i < n; i++) s += Number(d[i]) * (n + 1 - i);
    const r = (s * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return dig(9) === Number(d[9]) && dig(10) === Number(d[10]);
}

export interface CorrecaoPrioritario {
  cpf_correto?: string | null;
  nome_correto?: string | null;
  nome_municipio_correto?: string | null;
  nome_cliente_ligado?: string | null;
  "Responsável"?: string | null;
  coordenada_validada?: boolean | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  observacao?: string | null;
  atendimento?: string | null;
  decisao?: string | null;
  nome_alterado?: boolean | null;
  cpf_alterado?: boolean | null;
  municipio_alterado?: boolean | null;
}

/** Campo corrigido só é editável quando a respectiva validação está marcada "Sim". */
export function podeEditarCorrecao(alterado: boolean | null | undefined): boolean {
  return alterado === true;
}

const txt = (v?: string | null) => (v ?? "").trim() || null;

/** Valida e monta o payload de atualização. Retorna erros por campo. */
export function validarCorrecao(f: CorrecaoPrioritario): { erros: Record<string, string>; payload: Record<string, unknown> } {
  const erros: Record<string, string> = {};
  const cpf = txt(f.cpf_correto);
  if (cpf && !cpfValido(cpf)) erros.cpf_correto = "CPF inválido";
  if (f.coordenada_validada == null) erros.coordenada_validada = "Informe se a coordenada foi validada";

  const payload: Record<string, unknown> = {
    cpf_correto: cpf ? cpf.replace(/\D/g, "") : null,
    nome_correto: txt(f.nome_correto),
    nome_municipio_correto: txt(f.nome_municipio_correto),
    nome_cliente_ligado: txt(f.nome_cliente_ligado),
    "Responsável": txt(f["Responsável"]),
    coordenada_validada: f.coordenada_validada ?? null,
    observacao: txt(f.observacao),
    atendimento: txt(f.atendimento),
    decisao: txt(f.decisao),
    nome_alterado: f.nome_alterado ?? null,
    cpf_alterado: f.cpf_alterado ?? null,
    municipio_alterado: f.municipio_alterado ?? null,
  };

  if (fmtCoord(f.latitude) || fmtCoord(f.longitude)) {
    const lat = Number(fmtCoord(f.latitude));
    const lng = Number(fmtCoord(f.longitude));
    if (!fmtCoord(f.latitude) || !Number.isFinite(lat) || lat < -90 || lat > 90) erros.latitude = "Latitude inválida (-90 a 90)";
    if (!fmtCoord(f.longitude) || !Number.isFinite(lng) || lng < -180 || lng > 180) erros.longitude = "Longitude inválida (-180 a 180)";
    payload.latitude = fmtCoord(f.latitude);
    payload.longitude = fmtCoord(f.longitude);
  }
  return { erros, payload };
}
