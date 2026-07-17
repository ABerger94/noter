import Link from "next/link";
import { getCourses, getNotes, getTags } from "@/lib/data";

function excerpt(content: string, length = 160) {
  const plain = content
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/[#>*_`~-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return plain.length > length ? `${plain.slice(0, length)}...` : plain;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; course?: string; tag?: string }>;
}) {
  const { q, course, tag } = await searchParams;
  const [notes, courses, tags] = await Promise.all([
    getNotes({ q, courseId: course, tag }),
    getCourses(),
    getTags(),
  ]);

  const hasFilters = Boolean(q || course || tag);

  return (
    <div className="space-y-6">
      <form className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="text"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search notes by title or content..."
          className="w-full flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
        <select
          name="course"
          defaultValue={course ?? ""}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        >
          <option value="">All courses</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          name="tag"
          defaultValue={tag ?? ""}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        >
          <option value="">All tags</option>
          {tags.map((t) => (
            <option key={t.id} value={t.name}>
              #{t.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
        >
          Filter
        </button>
        {hasFilters && (
          <Link
            href="/"
            className="text-sm text-slate-500 hover:text-indigo-600 dark:text-slate-400"
          >
            Clear
          </Link>
        )}
      </form>

      {notes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center dark:border-slate-700">
          <p className="text-slate-600 dark:text-slate-300">
            {hasFilters
              ? "No notes match your filters."
              : "No notes yet. Create your first note to get started."}
          </p>
          {!hasFilters && (
            <Link
              href="/notes/new"
              className="mt-4 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
            >
              + New note
            </Link>
          )}
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {notes.map((note) => (
            <li key={note.id}>
              <div className="relative h-full rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-indigo-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
                <Link
                  href={`/notes/${note.id}`}
                  className="absolute inset-0 z-0 rounded-xl"
                  aria-label={note.title}
                />
                <div className="pointer-events-none relative z-0 flex items-start justify-between gap-2">
                  <h2 className="font-medium text-slate-900 dark:text-slate-100">
                    {note.title}
                  </h2>
                  {note.attachments.length > 0 && (
                    <span className="shrink-0 text-xs text-slate-400">
                      {note.attachments.length} image
                      {note.attachments.length > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                {note.content && (
                  <p className="pointer-events-none relative z-0 mt-1 line-clamp-3 text-sm text-slate-500 dark:text-slate-400">
                    {excerpt(note.content)}
                  </p>
                )}
                <div className="relative z-10 mt-3 flex flex-wrap items-center gap-2">
                  {note.course && (
                    <span
                      className="pointer-events-none rounded-full px-2 py-0.5 text-xs font-medium text-white"
                      style={{ backgroundColor: note.course.color }}
                    >
                      {note.course.name}
                    </span>
                  )}
                  {note.tags.map(({ tag }) => (
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
                  Created {new Date(note.createdAt).toLocaleDateString()}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
