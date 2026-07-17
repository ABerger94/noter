"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Flashcard } from "@/lib/flashcards";
import MarkdownContent from "../notes/markdown-content";

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function StudySession({ cards }: { cards: Flashcard[] }) {
  // Start in stable (unshuffled) order so server and client render identical
  // markup; "Shuffle" (a real click, not an effect) is what randomizes it.
  const [order, setOrder] = useState<number[]>(() => cards.map((_, i) => i));
  const [position, setPosition] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const current = cards[order[position]];

  const goNext = useMemo(
    () => () => {
      setPosition((p) => Math.min(p + 1, order.length - 1));
      setRevealed(false);
    },
    [order.length]
  );

  const goPrev = useMemo(
    () => () => {
      setPosition((p) => Math.max(p - 1, 0));
      setRevealed(false);
    },
    []
  );

  function reshuffle() {
    setOrder(shuffle(cards.map((_, i) => i)));
    setPosition(0);
    setRevealed(false);
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLElement && ["INPUT", "SELECT", "TEXTAREA"].includes(e.target.tagName)) {
        return;
      }
      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        setRevealed((r) => !r);
      } else if (e.code === "ArrowRight") {
        goNext();
      } else if (e.code === "ArrowLeft") {
        goPrev();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goNext, goPrev]);

  if (cards.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center dark:border-slate-700">
        <p className="text-slate-600 dark:text-slate-300">
          No notes match these filters yet.
        </p>
      </div>
    );
  }

  const isLast = position === order.length - 1;
  const isFirst = position === 0;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
        <span>
          Card {position + 1} of {order.length}
        </span>
        <button
          type="button"
          onClick={reshuffle}
          className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
        >
          Shuffle
        </button>
      </div>

      <div
        role="button"
        tabIndex={0}
        onClick={() => setRevealed((r) => !r)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setRevealed((r) => !r);
          }
        }}
        className="w-full cursor-pointer rounded-xl border border-slate-200 bg-white p-6 text-left shadow-sm dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            {current.kind === "term" ? "Term" : "Section"}
          </span>
          {current.course && (
            <span
              className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
              style={{ backgroundColor: current.course.color }}
            >
              {current.course.name}
            </span>
          )}
          {current.tags.map((tag) => (
            <Link
              key={tag.id}
              href={{ pathname: "/", query: { tag: tag.name } }}
              onClick={(e) => e.stopPropagation()}
              className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 hover:bg-indigo-100 hover:text-indigo-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-indigo-950 dark:hover:text-indigo-300"
            >
              #{tag.name}
            </Link>
          ))}
        </div>

        <p className="mt-3 text-xs text-slate-400">{current.noteTitle}</p>
        <h2 className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-100">
          {current.front}
        </h2>

        {!revealed ? (
          <p className="mt-6 text-sm text-slate-400">
            Click, or press space, to reveal &rarr;
          </p>
        ) : (
          <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
            {current.back ? (
              <div className="prose prose-slate max-w-none dark:prose-invert">
                <MarkdownContent content={current.back} />
              </div>
            ) : (
              <p className="text-sm text-slate-400">No written content on this note.</p>
            )}
            {current.attachments.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {current.attachments.map((att) => (
                  <div
                    key={att.id}
                    className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/attachments/${att.id}`}
                      alt={att.filename}
                      className="aspect-square w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
            <Link
              href={`/notes/${current.noteId}`}
              onClick={(e) => e.stopPropagation()}
              className="mt-4 inline-block text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
            >
              Open full note &rarr;
            </Link>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={goPrev}
          disabled={isFirst}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:pointer-events-none disabled:opacity-40 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          &larr; Previous
        </button>
        <button
          type="button"
          onClick={() => setRevealed((r) => !r)}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
        >
          {revealed ? "Hide" : "Show answer"}
        </button>
        <button
          type="button"
          onClick={goNext}
          disabled={isLast}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:pointer-events-none disabled:opacity-40 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          Next &rarr;
        </button>
      </div>
    </div>
  );
}
