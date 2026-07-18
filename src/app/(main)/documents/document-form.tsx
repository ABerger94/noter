"use client";

import { useState, useTransition } from "react";

type Course = { id: string; name: string };

export default function DocumentForm({
  action,
  courses,
}: {
  action: (formData: FormData) => void;
  courses: Course[];
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = e.currentTarget;
    const fileInput = form.elements.namedItem("file") as HTMLInputElement | null;
    const file = fileInput?.files?.[0];

    if (!file) {
      setError("Choose a PDF to upload.");
      return;
    }
    if (file.type !== "application/pdf") {
      setError("Only PDF files are supported.");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setError("PDF is too large (max 4MB).");
      return;
    }

    const formData = new FormData(form);
    startTransition(() => {
      action(formData);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-slate-200 bg-white p-5">
      <div>
        <input
          name="title"
          required
          placeholder="Document title"
          className="w-full border-0 border-b border-slate-200 px-0 pb-2 text-xl font-semibold outline-none focus:border-indigo-500"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Course
          </label>
          <select
            name="courseId"
            defaultValue=""
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
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
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Tags (comma separated)
          </label>
          <input
            name="tags"
            placeholder="syllabus, week3"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">PDF file</label>
        <input
          type="file"
          name="file"
          accept="application/pdf"
          required
          className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
        />
        <p className="mt-1 text-xs text-slate-400">PDF only, up to 4MB.</p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
      >
        {isPending ? "Uploading..." : "Upload document"}
      </button>
    </form>
  );
}
