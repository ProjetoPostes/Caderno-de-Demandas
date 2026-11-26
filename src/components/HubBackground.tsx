import { useTheme } from "next-themes";
import { fundoDoTema } from "@/lib/fundoHub";

/**
 * Plano de fundo do MainHub: a arte institucional (que já traz a própria logo
 * no canto superior direito e a paisagem com poste e casas no canto inferior
 * direito) pintada atrás de todo o conteúdo, como se fosse o fundo da tela. A
 * camada usa z-index negativo dentro do contexto de empilhamento isolado criado
 * pela raiz da página, então nunca tapa cards, botões nem o cabeçalho. A arte
 * muda com o tema: o Ártico usa a sua própria, em tons de azul; os demais temas
 * usam a arte padrão do Luz para Todos. A cor de base vem da própria arte, para
 * que nenhuma faixa fique branca caso a imagem não cubra a tela inteira.
 *
 * A arte começa abaixo do cabeçalho: `inicioAbaixoDo` é a altura (em px) da
 * barra do cabeçalho, medida na página, então a faixa superior da tela fica
 * livre e o desenho aparece só a partir dali.
 */
interface HubBackgroundProps {
  /** Altura do cabeçalho, em px. A arte começa logo abaixo dela. */
  inicioAbaixoDo?: number;
}

export function HubBackground({ inicioAbaixoDo = 0 }: HubBackgroundProps) {
  const { resolvedTheme } = useTheme();
  const { imagem, corBase, posicao } = fundoDoTema(resolvedTheme);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[-1]"
      style={{
        top: `${inicioAbaixoDo}px`,
        backgroundColor: corBase,
        backgroundImage: `url(${imagem})`,
        backgroundSize: "cover",
        backgroundPosition: posicao,
        backgroundRepeat: "no-repeat",
      }}
    />
  );
}
