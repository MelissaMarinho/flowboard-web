export default function ProjectsLoading() {
  return (
    <div className="animate-pulse space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-28 rounded-lg bg-gray-200" />
        <div className="h-9 w-44 rounded-lg bg-gray-100" />
      </div>

      {/* Two workspace sections */}
      {Array.from({ length: 2 }).map((_, w) => (
        <div key={w}>
          <div className="mb-4 h-3.5 w-24 rounded bg-gray-200" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, p) => (
              <div
                key={p}
                className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-5"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-gray-100" />
                  <div className="h-4 w-32 rounded bg-gray-200" />
                </div>
                <div className="h-3 w-full rounded bg-gray-100" />
                <div className="mt-auto h-3 w-14 rounded bg-gray-100" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
