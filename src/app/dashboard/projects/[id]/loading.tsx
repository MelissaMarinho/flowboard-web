export default function ProjectLoading() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-8 w-48 rounded-lg bg-gray-200" />
          <div className="h-4 w-64 rounded bg-gray-100" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-32 rounded-lg bg-gray-100" />
          <div className="h-9 w-28 rounded-lg bg-gray-100" />
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex gap-3">
        <div className="h-9 w-48 rounded-lg bg-gray-100" />
        <div className="h-9 w-36 rounded-lg bg-gray-100" />
      </div>

      {/* Kanban columns */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, col) => (
          <div key={col} className="rounded-2xl border border-gray-200 bg-white p-4">
            <div className="mb-4 flex items-center gap-2">
              <div className="h-5 w-20 rounded-full bg-gray-100" />
              <div className="h-4 w-4 rounded-full bg-gray-100" />
            </div>
            <div className="space-y-2">
              {Array.from({ length: col === 0 ? 3 : col === 1 ? 2 : 1 }).map((_, card) => (
                <div key={card} className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5 h-4 w-4 flex-shrink-0 rounded bg-gray-200" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3.5 w-full rounded bg-gray-200" />
                      <div className="h-3 w-2/3 rounded bg-gray-100" />
                    </div>
                  </div>
                  <div className="ml-6 mt-2 flex items-center justify-between">
                    <div className="h-4 w-12 rounded-full bg-gray-200" />
                    <div className="h-5 w-5 rounded-full bg-gray-100" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Activity feed skeleton */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="mb-4 h-5 w-20 rounded bg-gray-200" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="h-6 w-6 flex-shrink-0 rounded-full bg-gray-100" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-3/4 rounded bg-gray-100" />
                <div className="h-2.5 w-16 rounded bg-gray-100" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
