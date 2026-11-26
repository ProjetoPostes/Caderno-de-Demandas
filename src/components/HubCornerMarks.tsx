import logoLuzParaTodos from "@/assets/logo-luz-para-todos.png";

interface HubMark {
  id: string;
  src: string;
  alt: string;
}

/**
 * Imagens decorativas fixas no canto inferior direito do MainHub.
 * Para incluir outra imagem, basta acrescentar uma entrada nesta lista.
 */
const marks: HubMark[] = [
  { id: "luz-para-todos", src: logoLuzParaTodos, alt: "Luz para Todos" },
];

export function HubCornerMarks() {
  return (
    <div className="pointer-events-none fixed bottom-16 right-5 z-[5] flex flex-col items-end gap-3 sm:bottom-20 sm:right-8">
      {marks.map((mark) => (
        <img
          key={mark.id}
          src={mark.src}
          alt={mark.alt}
          className="w-12 rounded-xl bg-foreground/90 p-1.5 shadow-lg ring-1 ring-foreground/10 sm:w-20 sm:p-2"
        />
      ))}
    </div>
  );
}
