import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteDocument } from "@/app/actions/documents";
import { getDocument } from "@/lib/data";
import DeleteDocumentButton from "../delete-document-button";

export default async function DocumentViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const document = await getDocument(id);

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
        </div>
      </div>
    </article>
  );
}
