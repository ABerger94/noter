import { createDocument } from "@/app/actions/documents";
import { getCourses } from "@/lib/data";
import DocumentForm from "../document-form";

export const dynamic = "force-dynamic";

export default async function NewDocumentPage() {
  const courses = await getCourses();

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-xl font-semibold text-slate-900 dark:text-slate-100">
        Upload document
      </h1>
      <DocumentForm action={createDocument} courses={courses} />
    </div>
  );
}
