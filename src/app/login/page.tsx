import LoginForm from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-200 px-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-300 bg-white p-8 shadow-lg">
        <h1 className="text-2xl font-semibold text-slate-900">
          Note<span className="text-indigo-600">r</span>
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Enter the password to access your notes.
        </p>
        <LoginForm next={next ?? "/"} />
      </div>
    </div>
  );
}
