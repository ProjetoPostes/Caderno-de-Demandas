import proj4 from "proj4";
import { fmtCoord, coordsDoMapa } from "./coords";

export interface CoordenadasSolicitacao {
  tipo_coordenada: string;
  fuso_utm: string;
  hemisferio_utm: string;
  coordenada_x_solicitacao: string;
  coordenada_y_solicitacao: string;
}

export function validarTipoCoordenada(form: CoordenadasSolicitacao): string | null {
  if (!["utm", "graus_decimais"].includes(form.tipo_coordenada)) return "Selecione o tipo de coordenada.";
  if (form.tipo_coordenada === "utm") {
    const fuso = Number(form.fuso_utm);
    if (!form.fuso_utm.trim() || !Number.isInteger(fuso) || fuso < 1 || fuso > 60) return "Informe um fuso UTM inteiro de 1 a 60.";
    if (!["N", "S"].includes(form.hemisferio_utm)) return "Selecione o hemisfério UTM.";
  }
  return null;
}

export function localizarCoordenadas(form: CoordenadasSolicitacao) {
  const erro = validarTipoCoordenada(form);
  if (erro) throw new Error(erro);
  const xTexto = fmtCoord(form.coordenada_x_solicitacao);
  const yTexto = fmtCoord(form.coordenada_y_solicitacao);
  const x = Number(xTexto);
  const y = Number(yTexto);
  if (!xTexto || !yTexto || !Number.isFinite(x) || !Number.isFinite(y)) throw new Error("Preencha coordenadas X e Y numéricas.");
  let latitude = x;
  let longitude = y;
  if (form.tipo_coordenada === "utm") {
    if (x < 100000 || x > 900000 || y < 0 || y > 10000000) throw new Error("Coordenadas UTM fora dos limites: X entre 100.000 e 900.000 e Y entre 0 e 10.000.000 metros.");
    // UTM X = easting, Y = northing; geographic X/Y follow the existing latitude/longitude convention.
    [longitude, latitude] = proj4(`+proj=utm +zone=${Number(form.fuso_utm)} ${form.hemisferio_utm === "S" ? "+south" : ""} +datum=WGS84 +units=m +no_defs`, "EPSG:4326", [x, y]);
  }
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) throw new Error("Latitude deve estar entre -90 e 90 e longitude entre -180 e 180.");
  const mapa = coordsDoMapa(latitude, longitude);
  if (!mapa) throw new Error("Não foi possível localizar as coordenadas.");
  return { latitude, longitude, mapsUrl: mapa.url, earthUrl: `https://earth.google.com/web/@${latitude},${longitude},0a,1000d,35y,0h,0t,0r` };
}