"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Flashcard } from "@/lib/flashcards";
import SlideshowCard from "./slideshow-card";

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
  const idleRef = useRef(false);

  useEffect(() => {
    idleRef.current = idle;
  }, [idle]);

  const armTimer = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => setIdle(true), IDLE_MS);
  }, []);

  const wake = useCallback(() => {
    setIdle(false);
    armTimer();
  }, [armTimer]);

  // Scrolling/wheeling should count as activity that resets the idle timer,
  // but shouldn't dismiss the overlay once it's already showing - otherwise
  // scrolling to read a tall card immediately closes it.
  const trackScrollActivity = useCallback(() => {
    if (idleRef.current) return;
    armTimer();
  }, [armTimer]);

  useEffect(() => {
    const dismissEvents: (keyof WindowEventMap)[] = [
      "mousemove",
      "mousedown",
      "keydown",
      "touchstart",
    ];
    const scrollEvents: (keyof WindowEventMap)[] = ["scroll", "wheel"];
    dismissEvents.forEach((e) => window.addEventListener(e, wake));
    scrollEvents.forEach((e) => window.addEventListener(e, trackScrollActivity));
    armTimer();
    return () => {
      dismissEvents.forEach((e) => window.removeEventListener(e, wake));
      scrollEvents.forEach((e) => window.removeEventListener(e, trackScrollActivity));
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [wake, trackScrollActivity, armTimer]);

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
      className="fixed inset-0 z-50 cursor-pointer overflow-y-auto bg-slate-950"
    >
      <div className="flex min-h-full flex-col items-center justify-center p-8">
        {!card ? (
          <p className="text-sm text-slate-500">Loading...</p>
        ) : (
          <SlideshowCard card={card} />
        )}
        <p className="mt-6 text-xs text-slate-600">Move, click, or press any key to continue</p>
      </div>
    </div>
  );
}
