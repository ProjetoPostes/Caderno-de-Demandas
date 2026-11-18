// Utilitários de coordenada: o Google Maps só aceita o ponto "." como separador decimal.

/**
 * Normaliza uma coordenada para o formato aceito pelo Google Maps (sempre com ".").
 * Aceita números, strings com vírgula decimal ("-5,123456"), com espaços e
 * com milhares (" -1.234,56" -> "-1234.56").
 */
export const fmtCoord = (v?: number | string | null): string => {
  if (v == null) return "";
  let s = String(v).trim().replace(/\s+/g, "");
  if (!s) return "";
  if (s.includes(",") && s.includes(".")) {
    const ultimoPonto = s.lastIndexOf(".");
    const ultimaVirgula = s.lastIndexOf(",");
    if (ultimaVirgula > ultimoPonto) {
      // vírgula é o decimal, pontos são milhares
      s = s.replace(/\./g, "").replace(",", ".");
    } else {
      // ponto é o decimal, vírgulas são milhares
      s = s.replace(/,/g, "");
    }
  } else if (s.includes(",")) {
    s = s.replace(/,/g, ".");
  }
  return s;
};

/**
 * Monta o link do Google Maps com as duas coordenadas separadas por vírgula e
 * sempre com "." como separador decimal. Retorna null se faltar alguma coordenada.
 */
export const coordsDoMapa = (
  lat?: number | string | null,
  lng?: number | string | null,
): { lat: string; lng: string; texto: string; url: string } | null => {
  const a = fmtCoord(lat);
  const b = fmtCoord(lng);
  if (!a || !b) return null;
  return {
    lat: a,
    lng: b,
    texto: `${a}, ${b}`,
    url: `https://www.google.com/maps?q=${encodeURIComponent(`${a},${b}`)}`,
  };
};
