import { createCourse, deleteCourse } from "@/app/actions/courses";
import { getCourses } from "@/lib/data";
import DeleteCourseButton from "./delete-course-button";

export const dynamic = "force-dynamic";

export default async function CoursesPage() {
  const courses = await getCourses();

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          Courses
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Organize your notes by course or subject.
        </p>
      </div>

      <form
        action={createCourse}
        className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="flex-1">
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Course name
          </label>
          <input
            name="name"
            required
            placeholder="e.g. Statistics 501"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Color
          </label>
          <input
            name="color"
            type="color"
            defaultValue="#6366f1"
            className="h-9 w-14 rounded-lg border border-slate-300 dark:border-slate-700"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          Add course
        </button>
      </form>

      {courses.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          No courses yet. Add one above.
        </p>
      ) : (
        <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
          {courses.map((course) => (
            <li
              key={course.id}
              className="flex items-center justify-between gap-3 px-4 py-3"
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: course.color }}
                />
                <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  {course.name}
                </span>
              </div>
              <DeleteCourseButton
                action={deleteCourse.bind(null, course.id)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
