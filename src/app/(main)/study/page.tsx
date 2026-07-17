import { getCourses, getNotes, getTags } from "@/lib/data";
import StudySession from "./study-session";

export const dynamic = "force-dynamic";

export default async function StudyPage({
  searchParams,
}: {
  searchParams: Promise<{ course?: string; tag?: string }>;
}) {
  const { course, tag } = await searchParams;
  const [notes, courses, tags] = await Promise.all([
    getNotes({ courseId: course, tag }),
    getCourses(),
    getTags(),
  ]);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Study</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Flip through your notes like flashcards: see the title, try to recall
        it, then reveal the content.
      </p>

      <form className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
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
          Apply
        </button>
      </form>

      <div className="mt-6">
        <StudySession key={`${course ?? ""}::${tag ?? ""}`} notes={notes} />
      </div>
    </div>
  );
}
