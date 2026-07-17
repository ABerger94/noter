import Link from "next/link";
import { getCourses, getNotes, getTags } from "@/lib/data";
import NotesList from "./notes-list";

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
          className="w-full flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
        <select
          name="course"
          defaultValue={course ?? ""}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
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
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
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
        <NotesList notes={notes} />
      )}
    </div>
  );
}
