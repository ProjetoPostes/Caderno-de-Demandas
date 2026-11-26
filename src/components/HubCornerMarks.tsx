import logoLuzParaTodos from "@/assets/logo-luz-para-todos.png";

interface HubMark {
  id: string;
  src: string;
  alt: string;
}

/**
 * Imagens decorativas fixas no canto inferior direito do MainHub.
 * Ficam presas ao plano de fundo (não acompanham a rolagem) e o tamanho
 * acompanha as dimensões da tela via clamp(), sem depender de breakpoints.
 * Para incluir outra imagem, basta acrescentar uma entrada nesta lista.
 */
const marks: HubMark[] = [
  { id: "luz-para-todos", src: logoLuzParaTodos, alt: "Luz para Todos" },
];

/** Largura da marca: mínima em telas pequenas, proporcional à tela, máx. em telas grandes. */
const LARGURA_MARCA = "clamp(56px, min(11vw, 28vh), 190px)";
/** Distância da borda direita, também proporcional à tela. */
const AFASTAMENTO_DIREITA = "clamp(12px, 1.6vw, 36px)";
/** Distância da base, mantendo a marca acima do rodapé. */
const AFASTAMENTO_BASE = "clamp(58px, 9vh, 110px)";

export function HubCornerMarks() {
  return (
    <div
      className="pointer-events-none fixed bottom-0 right-0 z-[5] flex flex-col items-end"
      style={{
        gap: "clamp(8px, 1.2vw, 18px)",
        right: AFASTAMENTO_DIREITA,
        bottom: AFASTAMENTO_BASE,
      }}
    >
      {marks.map((mark) => (
        <img
          key={mark.id}
          src={mark.src}
          alt={mark.alt}
          style={{ width: LARGURA_MARCA, height: "auto" }}
        />
      ))}
    </div>
  );
}
