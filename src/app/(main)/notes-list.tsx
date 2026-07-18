"use client";

import Link from "next/link";
import { useState } from "react";
import type { getDocuments, getNotes } from "@/lib/data";

type Note = Awaited<ReturnType<typeof getNotes>>[number];
type DocumentItem = Awaited<ReturnType<typeof getDocuments>>[number];

type LibraryItem =
  | { kind: "note"; createdAt: Date; note: Note }
  | { kind: "document"; createdAt: Date; document: DocumentItem };

function excerpt(content: string, length = 160) {
  const plain = content
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/[#>*_`~-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return plain.length > length ? `${plain.slice(0, length)}...` : plain;
}

export default function NotesList({
  notes,
  documents,
}: {
  notes: Note[];
  documents: DocumentItem[];
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function clearSelection() {
    setSelected(new Set());
  }

  const items: LibraryItem[] = [
    ...notes.map((note) => ({ kind: "note" as const, createdAt: note.createdAt, note })),
    ...documents.map((document) => ({
      kind: "document" as const,
      createdAt: document.createdAt,
      document,
    })),
  ].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  async function downloadSelected() {
    // Preserve the order notes are listed in, not click order.
    const ids = notes.filter((note) => selected.has(note.id)).map((note) => note.id);
    if (ids.length === 0) return;

    setDownloading(true);
    setError(null);
    try {
      const res = await fetch(`/api/export?ids=${ids.join(",")}`);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "notes-export.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError("Couldn't generate the PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-3 text-sm">
        <span className="text-slate-500 dark:text-slate-400">
          {selected.size > 0
            ? `${selected.size} note${selected.size > 1 ? "s" : ""} selected`
            : "Select notes to download them as a PDF"}
        </span>
        {selected.size > 0 && (
          <>
            <button
              type="button"
              onClick={downloadSelected}
              disabled={downloading}
              className="rounded-lg bg-indigo-600 px-3 py-1.5 font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
            >
              {downloading ? "Preparing PDF..." : "Download PDF"}
            </button>
            <button
              type="button"
              onClick={clearSelection}
              className="text-slate-500 hover:text-indigo-600 dark:text-slate-400"
            >
              Clear selection
            </button>
          </>
        )}
        {error && <span className="text-red-500">{error}</span>}
      </div>

      <ul className="grid gap-4 sm:grid-cols-2">
        {items.map((item) =>
          item.kind === "note" ? (
            <li key={`note-${item.note.id}`}>
              <div className="relative h-full rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-indigo-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-800">
                <Link
                  href={`/notes/${item.note.id}`}
                  className="absolute inset-0 z-0 rounded-xl"
                  aria-label={item.note.title}
                />
                <label
                  className="absolute right-3 top-3 z-10 flex h-5 w-5 items-center justify-center rounded border border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-700"
                  aria-label={`Select ${item.note.title}`}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(item.note.id)}
                    onChange={() => toggle(item.note.id)}
                    className="h-3.5 w-3.5 accent-indigo-600"
                  />
                </label>
                <div className="pointer-events-none relative z-0 flex items-start justify-between gap-2 pr-6">
                  <h2 className="font-medium text-slate-900 dark:text-slate-100">
                    {item.note.title}
                  </h2>
                  {item.note.attachments.length > 0 && (
                    <span className="shrink-0 text-xs text-slate-400">
                      {item.note.attachments.length} image
                      {item.note.attachments.length > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                {item.note.content && (
                  <p className="pointer-events-none relative z-0 mt-1 line-clamp-3 text-sm text-slate-500 dark:text-slate-400">
                    {excerpt(item.note.content)}
                  </p>
                )}
                <div className="relative z-10 mt-3 flex flex-wrap items-center gap-2">
                  {item.note.course && (
                    <span
                      className="pointer-events-none rounded-full px-2 py-0.5 text-xs font-medium text-white"
                      style={{ backgroundColor: item.note.course.color }}
                    >
                      {item.note.course.name}
                    </span>
                  )}
                  {item.note.tags.map(({ tag }) => (
                    <Link
                      key={tag.id}
                      href={{ pathname: "/", query: { tag: tag.name } }}
                      className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 hover:bg-indigo-100 hover:text-indigo-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-indigo-950 dark:hover:text-indigo-300"
                    >
                      #{tag.name}
                    </Link>
                  ))}
                </div>
                <p className="pointer-events-none relative z-0 mt-3 text-xs text-slate-400">
                  Created {new Date(item.note.createdAt).toLocaleDateString()}
                </p>
              </div>
            </li>
          ) : (
            <li key={`doc-${item.document.id}`}>
              <Link
                href={`/documents/${item.document.id}`}
                className="block h-full rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-indigo-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
              >
                <div className="flex items-start gap-2">
                  <span className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-600 dark:bg-red-950 dark:text-red-300">
                    PDF
                  </span>
                  <h2 className="font-medium text-slate-900 dark:text-slate-100">
                    {item.document.title}
                  </h2>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {item.document.course && (
                    <span
                      className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
                      style={{ backgroundColor: item.document.course.color }}
                    >
                      {item.document.course.name}
                    </span>
                  )}
                  {item.document.tags.map(({ tag }) => (
                    <span
                      key={tag.id}
                      className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                    >
                      #{tag.name}
                    </span>
                  ))}
                </div>
                <p className="mt-3 text-xs text-slate-400">
                  Uploaded {new Date(item.document.createdAt).toLocaleDateString()}
                </p>
              </Link>
            </li>
          )
        )}
      </ul>
    </div>
  );
}
