import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { renderNotesPdf } from "@/lib/notes-pdf";

export async function GET(request: NextRequest) {
  const idsParam = request.nextUrl.searchParams.get("ids") ?? "";
  const ids = idsParam
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  if (ids.length === 0) {
    return NextResponse.json({ error: "No note ids provided" }, { status: 400 });
  }

  const notes = await prisma.note.findMany({
    where: { id: { in: ids } },
    include: { course: true, tags: { include: { tag: true } } },
  });

  const byId = new Map(notes.map((note) => [note.id, note]));
  const ordered = ids
    .map((id) => byId.get(id))
    .filter((note): note is (typeof notes)[number] => Boolean(note));

  if (ordered.length === 0) {
    return NextResponse.json({ error: "No matching notes found" }, { status: 404 });
  }

  const pdf = await renderNotesPdf(ordered);

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="notes-export.pdf"`,
    },
  });
}
