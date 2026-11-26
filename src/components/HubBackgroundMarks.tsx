import logoLuzParaTodos from "@/assets/logo-luz-para-todos.png";

interface HubMark {
  id: string;
  src: string;
  alt: string;
}

/**
 * Marca do MainHub: imagens fixas no canto superior direito, pintadas atrás do
 * conteúdo (z-index negativo) como se fizessem parte do plano de fundo, sem
 * caixa de fundo própria. O afastamento do topo nunca cobre o cabeçalho fixo e
 * o tamanho acompanha as dimensões da tela via clamp(), sem depender de
 * breakpoints. Para incluir outra imagem, basta acrescentar uma entrada nesta
 * lista.
 */
const marks: HubMark[] = [
  { id: "luz-para-todos", src: logoLuzParaTodos, alt: "Luz para Todos" },
];

/** Altura do cabeçalho fixo (py-4 + conteúdo ~40px + borda), que a marca jamais pode cobrir. */
const ALTURA_CABECALHO = "73px";
/** Folga extra entre o fim do cabeçalho e o topo da marca. */
const AFASTAMENTO_TOPO = "clamp(16px, 3vh, 44px)";
/** Afastamento da borda direita: presente, mas sem encostar no canto. */
const AFASTAMENTO_DIR = "clamp(24px, 3.5vw, 96px)";
/** Largura da marca: mínima em telas pequenas, proporcional à tela, máx. em telas grandes. */
const LARGURA_MARCA = "clamp(72px, min(14vw, 40vh), 300px)";
/** Transparência: presente, mas sem disputar atenção com o conteúdo. */
const OPACIDADE_MARCA = 1;

export function HubBackgroundMarks() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[-1] hidden sm:flex flex-col items-end justify-start"
      style={{
        paddingTop: `calc(${ALTURA_CABECALHO} + ${AFASTAMENTO_TOPO})`,
        paddingRight: AFASTAMENTO_DIR,
        gap: "clamp(8px, 1.2vw, 18px)",
      }}
    >
      {marks.map((mark) => (
        <img
          key={mark.id}
          src={mark.src}
          alt={mark.alt}
          style={{
            width: LARGURA_MARCA,
            height: "auto",
            opacity: OPACIDADE_MARCA,
            filter: "drop-shadow(0 0 clamp(16px, 3vw, 48px) hsl(48 100% 70% / 0.55))",
          }}
        />
      ))}
    </div>
  );
}
