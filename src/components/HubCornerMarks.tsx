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
          className="w-16 sm:w-24"
        />
      ))}
    </div>
  );
}
