import fundoLuzParaTodos from "@/assets/fundo-luz-para-todos.webp";
import fundoArtico from "@/assets/fundo-artico.webp";

export interface FundoHub {
  /** Arte institucional exibida atrás do conteúdo do MainHub. */
  imagem: string;
  /** Cor de base, usada onde a arte não cobre a tela inteira. */
  corBase: string;
  /** Enquadramento da arte quando a tela tem outra proporção que ela. */
  posicao: string;
}

const FUNDO_PADRAO: FundoHub = {
  imagem: fundoLuzParaTodos,
  corBase: "#EAF4FC",
  posicao: "center top",
};

/**
 * O tema Ártico usa a própria arte institucional, em tons de azul, no lugar da
 * arte padrão do Luz para Todos. Os demais temas mantêm a arte padrão.
 *
 * As artes têm a logo no canto superior direito e a paisagem com poste e casas
 * no canto inferior direito, então o enquadramento acompanha a arte: quando a
 * tela é mais estreita que a imagem, o que sobra é recortado do lado esquerdo
 * (espaço vazio) e não da direita, onde estão as marcas.
 */
const FUNDOS_POR_TEMA: Record<string, FundoHub> = {
  artico: { imagem: fundoArtico, corBase: "#C4E1FA", posicao: "right top" },
};

export function fundoDoTema(theme: string | undefined): FundoHub {
  return (theme && FUNDOS_POR_TEMA[theme]) || FUNDO_PADRAO;
}
