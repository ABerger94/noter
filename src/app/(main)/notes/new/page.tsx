import { createNote } from "@/app/actions/notes";
import { getCourses } from "@/lib/data";
import NoteForm from "../note-form";

export const dynamic = "force-dynamic";

export default async function NewNotePage() {
  const courses = await getCourses();

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-xl font-semibold text-slate-900 dark:text-slate-100">
        New note
      </h1>
      <NoteForm action={createNote} courses={courses} submitLabel="Create note" />
    </div>
  );
}
