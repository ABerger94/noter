"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Flashcard } from "@/lib/flashcards";
import MarkdownContent from "./notes/markdown-content";

const IDLE_MS = 60_000; // show the slideshow after a minute of no activity
const SLIDE_MS = 20_000; // then advance to a new card every 20 seconds
const STUDY_SLIDE_MS = 30_000; // on the study page, give each slide 30 seconds

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function IdleSlideshow() {
  const pathname = usePathname();
  const slideMs = pathname?.startsWith("/study") ? STUDY_SLIDE_MS : SLIDE_MS;
  const [idle, setIdle] = useState(false);
  const [cards, setCards] = useState<Flashcard[] | null>(null);
  const [index, setIndex] = useState(0);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const armTimer = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => setIdle(true), IDLE_MS);
  }, []);

  const wake = useCallback(() => {
    setIdle(false);
    armTimer();
  }, [armTimer]);

  useEffect(() => {
    const events: (keyof WindowEventMap)[] = [
      "mousemove",
      "mousedown",
      "keydown",
      "touchstart",
      "scroll",
      "wheel",
    ];
    events.forEach((e) => window.addEventListener(e, wake));
    armTimer();
    return () => {
      events.forEach((e) => window.removeEventListener(e, wake));
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [wake, armTimer]);

  useEffect(() => {
    if (!idle) return;
    let cancelled = false;
    fetch("/api/flashcards")
      .then((res) => (res.ok ? res.json() : { cards: [] }))
      .then((data: { cards: Flashcard[] }) => {
        if (!cancelled) {
          setCards(shuffle(data.cards ?? []));
          setIndex(0);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCards([]);
          setIndex(0);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [idle]);

  useEffect(() => {
    if (!idle || !cards || cards.length < 2) return;
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % cards.length);
    }, slideMs);
    return () => clearInterval(interval);
  }, [idle, cards, slideMs]);

  if (!idle || (cards && cards.length === 0)) return null;

  const card = cards?.[index];

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={wake}
      onKeyDown={wake}
      className="fixed inset-0 z-50 flex cursor-pointer flex-col items-center justify-center bg-slate-950 p-8"
    >
      {!card ? (
        <p className="text-sm text-slate-500">Loading...</p>
      ) : (
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
          <h2 data-testid="idle-card-front" className="mt-1 text-2xl font-semibold text-slate-100">
            {card.front}
          </h2>

          {card.back && (
            <div className="prose prose-invert prose-slate mt-4 max-w-none border-t border-slate-800 pt-4">
              <MarkdownContent content={card.back} />
            </div>
          )}
        </div>
      )}
      <p className="mt-6 text-xs text-slate-600">Move, click, or press any key to continue</p>
    </div>
  );
}
