"use client";

import { useMemo, useState } from "react";

type NoteOption = { id: string; title: string; course: { name: string } | null };

export default function RelatedNotesPicker({
  allNotes,
  initialSelectedIds,
}: {
  allNotes: NoteOption[];
  initialSelectedIds: string[];
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelectedIds));
  const [query, setQuery] = useState("");

  const notesById = useMemo(() => {
    const map = new Map<string, NoteOption>();
    for (const note of allNotes) map.set(note.id, note);
    return map;
  }, [allNotes]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allNotes;
    return allNotes.filter((n) => n.title.toLowerCase().includes(q));
  }, [allNotes, query]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const selectedNotes = Array.from(selected)
    .map((id) => notesById.get(id))
    .filter((n): n is NoteOption => Boolean(n));

  return (
    <div>
      {selectedNotes.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {selectedNotes.map((note) => (
            <span
              key={note.id}
              className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
            >
              {note.title}
              <button
                type="button"
                onClick={() => toggle(note.id)}
                aria-label={`Remove link to ${note.title}`}
                className="text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-100"
              >
                &times;
              </button>
              <input type="hidden" name="relatedNoteIds" value={note.id} />
            </span>
          ))}
        </div>
      )}

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search notes to link..."
        className="mb-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
      />

      <div className="max-h-40 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700">
        {filtered.length === 0 ? (
          <p className="p-3 text-sm text-slate-400">No notes match.</p>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map((note) => (
              <li key={note.id}>
                <label className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800">
                  <input
                    type="checkbox"
                    checked={selected.has(note.id)}
                    onChange={() => toggle(note.id)}
                    className="h-4 w-4"
                  />
                  <span className="text-slate-700 dark:text-slate-200">{note.title}</span>
                  {note.course && (
                    <span className="ml-auto shrink-0 text-xs text-slate-400">
                      {note.course.name}
                    </span>
                  )}
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
