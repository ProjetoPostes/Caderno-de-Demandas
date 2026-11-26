import fundoLuzParaTodos from "@/assets/fundo-luz-para-todos.webp";

/**
 * Plano de fundo do MainHub: a arte institucional do Luz para Todos (que já traz
 * a própria logo no canto superior direito e a paisagem com poste e casas no
 * canto inferior direito) pintada atrás de todo o conteúdo, como se fosse o
 * fundo da tela. A camada usa z-index negativo dentro do contexto de
 * empilhamento isolado criado pela raiz da página, então nunca tapa cards,
 * botões nem o cabeçalho. A cor de base é o azul-celeste do próprio arquivo,
 * para que nenhuma faixa fique branca caso a imagem não cubra a tela inteira.
 *
 * A arte começa abaixo do cabeçalho: `inicioAbaixoDo` é a altura (em px) da
 * barra do cabeçalho, medida na página, então a faixa superior da tela fica
 * livre e o desenho aparece só a partir dali.
 */
const COR_BASE = "#EAF4FC";

interface HubBackgroundProps {
  /** Altura do cabeçalho, em px. A arte começa logo abaixo dela. */
  inicioAbaixoDo?: number;
}

export function HubBackground({ inicioAbaixoDo = 0 }: HubBackgroundProps) {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[-1]"
      style={{
        top: `${inicioAbaixoDo}px`,
        backgroundColor: COR_BASE,
        backgroundImage: `url(${fundoLuzParaTodos})`,
        backgroundSize: "cover",
        backgroundPosition: "center top",
        backgroundRepeat: "no-repeat",
      }}
    />
  );
}
