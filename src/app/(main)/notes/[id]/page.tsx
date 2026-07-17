import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteNote } from "@/app/actions/notes";
import { getNote, getRelatedNotes } from "@/lib/data";
import DeleteNoteButton from "../delete-note-button";
import MarkdownContent from "../markdown-content";

export default async function NoteViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [note, relatedNotes] = await Promise.all([getNote(id), getRelatedNotes(id)]);

  if (!note) notFound();

  const deleteNoteWithId = deleteNote.bind(null, note.id);

  return (
    <article className="mx-auto max-w-3xl">
      <Link
        href="/"
        className="mb-4 inline-block text-sm text-slate-500 hover:text-indigo-600"
      >
        &larr; Back to all notes
      </Link>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold text-slate-900">
              {note.title}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {note.course && (
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
                  style={{ backgroundColor: note.course.color }}
                >
                  {note.course.name}
                </span>
              )}
              {note.tags.map(({ tag }) => (
                <Link
                  key={tag.id}
                  href={{ pathname: "/", query: { tag: tag.name } }}
                  className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 hover:bg-indigo-100 hover:text-indigo-700"
                >
                  #{tag.name}
                </Link>
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Created {new Date(note.createdAt).toLocaleString()}
              {note.updatedAt.getTime() !== note.createdAt.getTime() &&
                ` · Updated ${new Date(note.updatedAt).toLocaleString()}`}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Link
              href={`/notes/${note.id}/edit`}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Edit
            </Link>
            <DeleteNoteButton action={deleteNoteWithId} />
          </div>
        </div>

        {note.content && (
          <div className="prose prose-slate max-w-none p-5">
            <MarkdownContent content={note.content} />
          </div>
        )}

        {note.attachments.length > 0 && (
          <div
            className={`p-5 ${note.content ? "border-t border-slate-100" : ""}`}
          >
            <p className="mb-2 text-sm font-medium text-slate-700">
              Images
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {note.attachments.map((att) => (
                <a
                  key={att.id}
                  href={`/api/attachments/${att.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="group block overflow-hidden rounded-lg border border-slate-200"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/attachments/${att.id}`}
                    alt={att.filename}
                    className="aspect-square w-full object-cover transition group-hover:scale-105"
                  />
                </a>
              ))}
            </div>
          </div>
        )}

        <div
          className={`p-5 ${
            note.content || note.attachments.length > 0
              ? "border-t border-slate-100"
              : ""
          }`}
        >
          <p className="mb-2 text-sm font-medium text-slate-700">
            Related notes
          </p>
          {relatedNotes.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {relatedNotes.map((related) => (
                <Link
                  key={related.id}
                  href={`/notes/${related.id}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-700 hover:border-indigo-300 hover:text-indigo-600"
                >
                  {related.course && (
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: related.course.color }}
                    />
                  )}
                  {related.title}
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">
              No related notes found yet. This fills in automatically based on
              shared tags and similar wording, once other notes overlap with
              this one.
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
