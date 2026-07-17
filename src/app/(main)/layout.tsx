import Link from "next/link";
import { logout } from "@/app/login/actions";
import IdleSlideshow from "./idle-slideshow";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-200 dark:bg-slate-950">
      <header className="sticky top-0 z-10 border-b border-slate-300 bg-white/80 backdrop-blur dark:border-slate-700 dark:bg-slate-800/80">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <Link
            href="/"
            className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100"
          >
            Note<span className="text-indigo-600 dark:text-indigo-400">r</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link
              href="/"
              className="text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400"
            >
              Notes
            </Link>
            <Link
              href="/courses"
              className="text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400"
            >
              Courses
            </Link>
            <Link
              href="/study"
              className="text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400"
            >
              Study
            </Link>
            <Link
              href="/notes/new"
              className="rounded-lg bg-indigo-600 px-3 py-1.5 font-medium text-white hover:bg-indigo-500"
            >
              + New note
            </Link>
            <form action={logout}>
              <button
                type="submit"
                className="text-slate-500 hover:text-red-500 dark:text-slate-400"
              >
                Log out
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        {children}
      </main>
      <IdleSlideshow />
    </div>
  );
}
