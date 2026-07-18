import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteDocument } from "@/app/actions/documents";
import { getDocument, getRelatedItems } from "@/lib/data";
import DeleteDocumentButton from "../delete-document-button";

export default async function DocumentViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [document, relatedItems] = await Promise.all([getDocument(id), getRelatedItems(id)]);

  if (!document) notFound();

  const deleteDocumentWithId = deleteDocument.bind(null, document.id);

  return (
    <article className="mx-auto max-w-4xl">
      <Link
        href="/documents"
        className="mb-4 inline-block text-sm text-slate-500 hover:text-indigo-600"
      >
        &larr; Back to all documents
      </Link>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold text-slate-900">
              {document.title}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {document.course && (
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
                  style={{ backgroundColor: document.course.color }}
                >
                  {document.course.name}
                </span>
              )}
              {document.tags.map(({ tag }) => (
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
              Uploaded {new Date(document.createdAt).toLocaleString()}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <a
              href={`/api/documents/${document.id}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Open PDF
            </a>
            <a
              href={`/api/documents/${document.id}`}
              download={document.filename}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Download
            </a>
            <DeleteDocumentButton action={deleteDocumentWithId} />
          </div>
        </div>

        <div className="p-5">
          <iframe
            src={`/api/documents/${document.id}`}
            title={document.title}
            className="h-[80vh] w-full rounded-lg border border-slate-200"
          />
          <p className="mt-2 text-center text-xs text-slate-400">
            Can&apos;t scroll past the first page? Mobile browsers don&apos;t support
            scrolling a PDF embedded like this -{" "}
            <a
              href={`/api/documents/${document.id}`}
              target="_blank"
              rel="noreferrer"
              className="text-indigo-600 hover:text-indigo-500"
            >
              open it in its own tab
            </a>{" "}
            instead.
          </p>
        </div>

        <div className="border-t border-slate-100 p-5">
          <p className="mb-2 text-sm font-medium text-slate-700">Related</p>
          {relatedItems.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {relatedItems.map((related) => (
                <Link
                  key={`${related.kind}-${related.id}`}
                  href={related.kind === "note" ? `/notes/${related.id}` : `/documents/${related.id}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-700 hover:border-indigo-300 hover:text-indigo-600"
                >
                  {related.course && (
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: related.course.color }}
                    />
                  )}
                  {related.kind === "document" && (
                    <span className="rounded bg-red-50 px-1 text-[10px] font-semibold uppercase tracking-wide text-red-600">
                      PDF
                    </span>
                  )}
                  {related.title}
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">
              Nothing related found yet. This fills in automatically based on
              shared tags and similar wording, once other notes or documents
              overlap with this one.
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
