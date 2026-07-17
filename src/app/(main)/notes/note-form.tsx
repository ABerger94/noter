"use client";

import { useRef, useState, useTransition } from "react";
import { compressImages } from "@/lib/compress-image";
import ContentEditor from "./content-editor";

type Course = { id: string; name: string };

type ExistingAttachment = { id: string; filename: string };

export default function NoteForm({
  action,
  courses,
  defaultValues,
  existingAttachments = [],
  submitLabel,
}: {
  action: (formData: FormData) => void;
  courses: Course[];
  defaultValues?: {
    title?: string;
    content?: string;
    courseId?: string;
    tags?: string;
  };
  existingAttachments?: ExistingAttachment[];
  submitLabel: string;
}) {
  const [toRemove, setToRemove] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function toggleRemove(id: string) {
    setToRemove((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);

    const form = e.currentTarget;
    const fileInput = form.elements.namedItem("images") as HTMLInputElement | null;
    const files = Array.from(fileInput?.files ?? []).filter((f) => f.size > 0);

    const formData = new FormData(form);
    formData.delete("images");

    if (files.length > 0) {
      setStatus(files.length > 1 ? "Compressing images..." : "Compressing image...");
      const { files: compressed, stillOverBudget } = await compressImages(files);

      if (stillOverBudget) {
        setBusy(false);
        setStatus(null);
        setError(
          "These images are still too large to upload together, even after compression. Try attaching fewer images at once, or split them across a couple of saves."
        );
        return;
      }

      for (const file of compressed) {
        formData.append("images", file, file.name);
      }
    }

    setStatus("Saving...");
    startTransition(() => {
      action(formData);
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
        <div>
          <input
            name="title"
            required
            defaultValue={defaultValues?.title}
            placeholder="Note title"
            className="w-full border-0 border-b border-slate-200 px-0 pb-2 text-xl font-semibold outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Course
            </label>
            <select
              name="courseId"
              defaultValue={defaultValues?.courseId ?? ""}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="">No course</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Tags (comma separated)
            </label>
            <input
              name="tags"
              defaultValue={defaultValues?.tags}
              placeholder="exam-prep, week3"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
        </div>

        <div>
          <ContentEditor name="content" defaultValue={defaultValues?.content} />
        </div>
      </div>

      <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Images</p>

        {existingAttachments.length > 0 && (
          <div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {existingAttachments.map((att) => (
                <label
                  key={att.id}
                  className={`relative block cursor-pointer overflow-hidden rounded-lg border ${
                    toRemove.has(att.id)
                      ? "border-red-400 opacity-50"
                      : "border-slate-200 dark:border-slate-700"
                  }`}
                >
                  <input
                    type="checkbox"
                    name="removeAttachments"
                    value={att.id}
                    className="absolute right-1 top-1 z-10 h-4 w-4"
                    checked={toRemove.has(att.id)}
                    onChange={() => toggleRemove(att.id)}
                  />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/attachments/${att.id}`}
                    alt={att.filename}
                    className="aspect-square w-full object-cover"
                  />
                </label>
              ))}
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Check an image to remove it when you save.
            </p>
          </div>
        )}

        <div>
          <input
            type="file"
            name="images"
            accept="image/*"
            multiple
            className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200 dark:text-slate-300 dark:file:bg-slate-800 dark:file:text-slate-200"
          />
          <p className="mt-1 text-xs text-slate-400">
            You can select multiple photos at once. Large photos are
            automatically resized before upload.
          </p>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <button
        type="submit"
        disabled={busy || isPending}
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
      >
        {busy || isPending ? (status ?? "Saving...") : submitLabel}
      </button>
    </form>
  );
}
