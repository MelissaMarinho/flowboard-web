"use client";

import { useState } from "react";
import { CheckSquare, Pencil, Trash2, Sparkles, Activity } from "lucide-react";

type ActivityType = "TASK_CREATED" | "TASK_UPDATED" | "TASK_DELETED" | "AI_SUMMARY_GENERATED";

export type ActivityEntry = {
  id: string;
  type: ActivityType;
  meta: Record<string, unknown>;
  createdAt: string;
  user: { id: string; name: string | null; image: string | null };
};

const TYPE_FILTERS: { value: ActivityType | ""; label: string }[] = [
  { value: "", label: "All" },
  { value: "TASK_CREATED", label: "Created" },
  { value: "TASK_UPDATED", label: "Updated" },
  { value: "TASK_DELETED", label: "Deleted" },
  { value: "AI_SUMMARY_GENERATED", label: "AI" },
];

const TYPE_ICON: Record<ActivityType, React.ReactNode> = {
  TASK_CREATED: <CheckSquare className="h-3.5 w-3.5" />,
  TASK_UPDATED: <Pencil className="h-3.5 w-3.5" />,
  TASK_DELETED: <Trash2 className="h-3.5 w-3.5" />,
  AI_SUMMARY_GENERATED: <Sparkles className="h-3.5 w-3.5" />,
};

const TYPE_COLOR: Record<ActivityType, string> = {
  TASK_CREATED: "bg-green-100 text-green-600 dark:bg-green-950/50 dark:text-green-400",
  TASK_UPDATED: "bg-indigo-100 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400",
  TASK_DELETED: "bg-red-100 text-red-500 dark:bg-red-950/50 dark:text-red-400",
  AI_SUMMARY_GENERATED: "bg-purple-100 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400",
};

function describe(type: ActivityType, meta: Record<string, unknown>): string {
  switch (type) {
    case "TASK_CREATED":
      return `Created task "${meta.taskTitle ?? "Unknown"}"`;
    case "TASK_UPDATED": {
      const changes = Array.isArray(meta.changes)
        ? (meta.changes as string[]).join(", ")
        : "";
      return `Updated "${meta.taskTitle ?? "Unknown"}"${changes ? `: ${changes}` : ""}`;
    }
    case "TASK_DELETED":
      return `Deleted task "${meta.taskTitle ?? "Unknown"}"`;
    case "AI_SUMMARY_GENERATED":
      return "Generated an AI summary";
    default:
      return "Performed an action";
  }
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function ActivityFeedView({
  activities,
}: {
  activities: ActivityEntry[];
}) {
  const [typeFilter, setTypeFilter] = useState<ActivityType | "">("");

  const filtered = typeFilter
    ? activities.filter((a) => a.type === typeFilter)
    : activities;

  return (
    <div className="space-y-4">
      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        {TYPE_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setTypeFilter(f.value)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              typeFilter === f.value
                ? "bg-indigo-600 text-white"
                : "border border-gray-200 bg-white text-gray-500 hover:border-indigo-300 hover:text-indigo-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:border-indigo-600 dark:hover:text-indigo-400"
            }`}
          >
            {f.label}
          </button>
        ))}
        <span className="ml-auto self-center text-xs text-gray-400 dark:text-gray-500">
          {filtered.length} event{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Feed */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-gray-400 dark:text-gray-600">
            <Activity className="h-8 w-8 opacity-40" />
            <p className="text-sm">No activity yet</p>
          </div>
        ) : (
          <ul>
            {filtered.map((entry, i) => {
              const isLast = i === filtered.length - 1;
              const initials = (entry.user.name ?? "?")[0].toUpperCase();

              return (
                <li
                  key={entry.id}
                  className={`flex items-start gap-4 px-5 py-4 ${
                    !isLast ? "border-b border-gray-50 dark:border-gray-800/60" : ""
                  }`}
                >
                  {/* User avatar */}
                  <div className="flex-shrink-0">
                    {entry.user.image ? (
                      <img
                        src={entry.user.image}
                        alt={entry.user.name ?? ""}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                        {initials}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        {entry.user.name ?? "Unknown"}
                      </span>
                      {/* Type badge */}
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          TYPE_COLOR[entry.type]
                        }`}
                      >
                        {TYPE_ICON[entry.type]}
                        {entry.type.replace(/_/g, " ").toLowerCase()}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                      {describe(entry.type, entry.meta)}
                    </p>
                  </div>

                  {/* Timestamp */}
                  <span className="flex-shrink-0 text-xs text-gray-400 dark:text-gray-500">
                    {timeAgo(entry.createdAt)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
