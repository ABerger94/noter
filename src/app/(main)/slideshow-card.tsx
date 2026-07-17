import type { Flashcard } from "@/lib/flashcards";
import MarkdownContent from "./notes/markdown-content";

export default function SlideshowCard({ card }: { card: Flashcard }) {
  return (
    <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-8 text-left shadow-2xl sm:p-10">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs font-medium text-slate-400">
          {card.kind === "term" ? "Term" : "Section"}
        </span>
        {card.course && (
          <span
            className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
            style={{ backgroundColor: card.course.color }}
          >
            {card.course.name}
          </span>
        )}
        {card.tags.map((tag) => (
          <span
            key={tag.id}
            className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-300"
          >
            #{tag.name}
          </span>
        ))}
      </div>

      <p className="mt-4 text-xs text-slate-500">{card.noteTitle}</p>
      <h2 data-testid="slideshow-card-front" className="mt-1 text-2xl font-semibold text-slate-100">
        {card.front}
      </h2>

      {card.back && (
        <div className="prose prose-invert prose-slate mt-4 max-w-none border-t border-slate-800 pt-4">
          <MarkdownContent content={card.back} />
        </div>
      )}
    </div>
  );
}
