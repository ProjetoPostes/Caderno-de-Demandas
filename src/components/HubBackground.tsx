import fundoLuzParaTodos from "@/assets/fundo-luz-para-todos.webp";

/**
 * Plano de fundo do MainHub: a arte institucional do Luz para Todos (que já traz
 * a própria logo no canto superior direito e a paisagem com poste e casas no
 * canto inferior direito) pintada atrás de todo o conteúdo, como se fosse o
 * fundo da tela. A camada usa z-index negativo dentro do contexto de
 * empilhamento isolado criado pela raiz da página, então nunca tapa cards,
 * botões nem o cabeçalho. A cor de base é o azul-celeste do próprio arquivo,
 * para que nenhuma faixa fique branca caso a imagem não cubra a tela inteira.
 */
const COR_BASE = "#EAF4FC";

/** Véu claro sobre a arte: preserva a legibilidade dos textos sem esconder o desenho. */
const VEU = "linear-gradient(hsl(var(--background) / 0.30), hsl(var(--background) / 0.45))";

export function HubBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[-1]"
      style={{
        backgroundColor: COR_BASE,
        backgroundImage: `${VEU}, url(${fundoLuzParaTodos})`,
        backgroundSize: "cover, cover",
        backgroundPosition: "center, center",
        backgroundRepeat: "no-repeat, no-repeat",
      }}
    />
  );
}
