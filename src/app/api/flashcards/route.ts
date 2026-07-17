import { NextResponse } from "next/server";
import { getNotes } from "@/lib/data";
import { buildFlashcards } from "@/lib/flashcards";

export async function GET() {
  const notes = await getNotes({});
  const cards = buildFlashcards(notes);
  return NextResponse.json({ cards });
}
