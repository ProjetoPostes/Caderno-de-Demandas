/**
 * Rotas internas do app.
 *
 * Manter a montagem das rotas em um único lugar evita que uma tela abra a
 * ficha de uma obra com um identificador inexistente (ex.: OS sem obra
 * vinculada), o que levaria o usuário a uma página vazia.
 */

/** Rota da tela de validação da obra, ou null quando não há obra vinculada. */
export function rotaObra(idObra: number | null | undefined): string | null {
  if (idObra === null || idObra === undefined || !Number.isFinite(idObra)) return null;
  return `/obras/${idObra}`;
}
