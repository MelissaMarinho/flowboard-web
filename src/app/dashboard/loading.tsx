export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-8">
      {/* Page heading */}
      <div className="space-y-2">
        <div className="h-8 w-52 rounded-lg bg-gray-200" />
        <div className="h-4 w-72 rounded bg-gray-100" />
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="h-8 w-8 rounded-lg bg-gray-100" />
            <div className="mt-3 h-7 w-10 rounded bg-gray-200" />
            <div className="mt-1.5 h-3 w-16 rounded bg-gray-100" />
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="h-64 rounded-2xl border border-gray-200 bg-white" />
        <div className="h-64 rounded-2xl border border-gray-200 bg-white" />
      </div>

      {/* Recent projects */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="mb-4 h-5 w-36 rounded bg-gray-200" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="h-4 w-40 rounded bg-gray-100" />
              <div className="h-5 w-16 rounded-full bg-gray-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
