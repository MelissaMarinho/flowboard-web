import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white px-6">
      <div className="max-w-2xl text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-1.5 text-sm font-medium text-indigo-700">
          Multi-tenant SaaS · AI-powered
        </div>
        <h1 className="text-5xl font-bold tracking-tight text-gray-900">
          Manage projects with <span className="text-indigo-600">FlowBoard</span>
        </h1>
        <p className="mt-6 text-lg text-gray-600">
          A full-stack SaaS dashboard built with Next.js, Supabase, Prisma, and a FastAPI AI microservice.
          Kanban boards, real-time updates, and AI-powered project summaries.
        </p>
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/register"
            className="rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
          >
            Get started free
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
