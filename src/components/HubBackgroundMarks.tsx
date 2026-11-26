import logoLuzParaTodos from "@/assets/logo-luz-para-todos.png";

interface HubMark {
  id: string;
  src: string;
  alt: string;
}

/**
 * Marca d'água do MainHub: imagens fixas, centralizadas e desfocadas, pintadas
 * atrás do conteúdo (z-index negativo) como se fizessem parte do plano de
 * fundo. O tamanho acompanha as dimensões da tela via clamp(), sem depender de
 * breakpoints. Para incluir outra imagem, basta acrescentar uma entrada nesta
 * lista.
 */
const marks: HubMark[] = [
  { id: "luz-para-todos", src: logoLuzParaTodos, alt: "Luz para Todos" },
];

/** Largura da marca: mínima em telas pequenas, proporcional à tela, máx. em telas grandes. */
const LARGURA_MARCA = "clamp(160px, min(26vw, 26vh), 420px)";
/** Desfoque proporcional ao tamanho, para ser lido como plano de fundo. */
const DESFOQUE_MARCA = "clamp(2px, 0.45vw, 6px)";
/** Transparência: presente, mas sem disputar atenção com o conteúdo. */
const OPACIDADE_MARCA = 0.32;

export function HubBackgroundMarks() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[-1] flex flex-col items-center justify-center"
      style={{ gap: "clamp(8px, 1.2vw, 18px)" }}
    >
      {marks.map((mark) => (
        <img
          key={mark.id}
          src={mark.src}
          alt={mark.alt}
          style={{
            width: LARGURA_MARCA,
            height: "auto",
            filter: `blur(${DESFOQUE_MARCA})`,
            opacity: OPACIDADE_MARCA,
          }}
        />
      ))}
    </div>
  );
}
