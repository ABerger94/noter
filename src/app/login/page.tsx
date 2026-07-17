import LoginForm from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-200 px-4 dark:bg-slate-950">
      <div className="w-full max-w-sm rounded-xl border border-slate-300 bg-white p-8 shadow-lg dark:border-slate-700 dark:bg-slate-800">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          Noter
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Enter the password to access your notes.
        </p>
        <LoginForm next={next ?? "/"} />
      </div>
    </div>
  );
}
