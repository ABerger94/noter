import Link from "next/link";
import { getCourses, getDocuments, getTags } from "@/lib/data";

export const dynamic = "force-dynamic";

function excerptText(content: string, length = 160) {
  const plain = content.replace(/\s+/g, " ").trim();
  return plain.length > length ? `${plain.slice(0, length)}...` : plain;
}

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; course?: string; tag?: string }>;
}) {
  const { q, course, tag } = await searchParams;
  const [documents, courses, tags] = await Promise.all([
    getDocuments({ q, courseId: course, tag }),
    getCourses(),
    getTags(),
  ]);

  const hasFilters = Boolean(q || course || tag);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          Documents
        </h1>
        <Link
          href="/documents/new"
          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500"
        >
          + Upload document
        </Link>
      </div>

      <form className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="text"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search documents by title or text..."
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
            href="/documents"
            className="text-sm text-slate-500 hover:text-indigo-600 dark:text-slate-400"
          >
            Clear
          </Link>
        )}
      </form>

      {documents.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center dark:border-slate-700">
          <p className="text-slate-600 dark:text-slate-300">
            {hasFilters
              ? "No documents match your filters."
              : "No documents yet. Upload a PDF to get started."}
          </p>
          {!hasFilters && (
            <Link
              href="/documents/new"
              className="mt-4 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
            >
              + Upload document
            </Link>
          )}
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {documents.map((document) => (
            <li key={document.id}>
              <Link
                href={`/documents/${document.id}`}
                className="block h-full rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-indigo-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
              >
                <div className="flex items-start gap-2">
                  <span className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-600 dark:bg-red-950 dark:text-red-300">
                    PDF
                  </span>
                  <h2 className="font-medium text-slate-900 dark:text-slate-100">
                    {document.title}
                  </h2>
                </div>
                {document.content && (
                  <p className="mt-1 line-clamp-3 text-sm text-slate-500 dark:text-slate-400">
                    {excerptText(document.content)}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {document.course && (
                    <span
                      className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
                      style={{ backgroundColor: document.course.color }}
                    >
                      {document.course.name}
                    </span>
                  )}
                  {document.tags.map(({ tag }) => (
                    <span
                      key={tag.id}
                      className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-900 dark:text-slate-300"
                    >
                      #{tag.name}
                    </span>
                  ))}
                </div>
                <p className="mt-3 text-xs text-slate-400">
                  Uploaded {new Date(document.createdAt).toLocaleDateString()}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
