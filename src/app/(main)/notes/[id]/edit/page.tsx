import { notFound } from "next/navigation";
import { updateNote } from "@/app/actions/notes";
import { getCourses, getNote, getOtherNotes, getRelatedNotes } from "@/lib/data";
import NoteForm from "../../note-form";

export default async function EditNotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [note, courses, otherNotes, relatedNotes] = await Promise.all([
    getNote(id),
    getCourses(),
    getOtherNotes(id),
    getRelatedNotes(id),
  ]);

  if (!note) notFound();

  const updateNoteWithId = updateNote.bind(null, id);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-xl font-semibold text-slate-900 dark:text-slate-100">
        Edit note
      </h1>
      <NoteForm
        action={updateNoteWithId}
        courses={courses}
        defaultValues={{
          title: note.title,
          content: note.content,
          courseId: note.courseId ?? "",
          tags: note.tags.map(({ tag }) => tag.name).join(", "),
        }}
        existingAttachments={note.attachments}
        otherNotes={otherNotes}
        relatedNoteIds={relatedNotes.map((n) => n.id)}
        submitLabel="Save changes"
      />
    </div>
  );
}
