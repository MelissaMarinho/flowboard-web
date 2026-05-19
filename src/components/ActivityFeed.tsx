"use client";

import { useState, useEffect } from "react";
import { PlusCircle, Pencil, Trash2, Sparkles, Activity } from "lucide-react";

type ActivityType = "TASK_CREATED" | "TASK_UPDATED" | "TASK_DELETED" | "AI_SUMMARY_GENERATED";

interface ActivityEntry {
  id: string;
  type: ActivityType;
  meta: Record<string, unknown>;
  createdAt: string;
  user: { id: string; name: string | null; image: string | null };
}

const typeConfig: Record<ActivityType, { icon: React.ElementType; color: string; label: (meta: Record<string, unknown>) => string }> = {
  TASK_CREATED: {
    icon: PlusCircle,
    color: "text-green-500",
    label: (m) => `created "${m.taskTitle}"`,
  },
  TASK_UPDATED: {
    icon: Pencil,
    color: "text-indigo-500",
    label: (m) => {
      const changes = (m.changes as string[] | undefined) ?? [];
      return `updated "${m.taskTitle}"${changes.length ? ` — ${changes.join(", ")}` : ""}`;
    },
  },
  TASK_DELETED: {
    icon: Trash2,
    color: "text-red-400",
    label: (m) => `deleted "${m.taskTitle}"`,
  },
  AI_SUMMARY_GENERATED: {
    icon: Sparkles,
    color: "text-violet-500",
    label: () => "generated an AI summary",
  },
};

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function ActivityFeed({ projectId }: { projectId: string }) {
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/projects/${projectId}/activity`)
      .then((r) => r.json())
      .then(setActivities)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [projectId]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
      <div className="mb-4 flex items-center gap-2">
        <Activity className="h-4 w-4 text-gray-400 dark:text-gray-500" />
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Activity</h2>
      </div>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <div className="h-6 w-6 animate-pulse rounded-full bg-gray-100 dark:bg-gray-700" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-3/4 animate-pulse rounded bg-gray-100 dark:bg-gray-700" />
                <div className="h-2.5 w-1/4 animate-pulse rounded bg-gray-100 dark:bg-gray-700" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && activities.length === 0 && (
        <p className="text-sm text-gray-400 dark:text-gray-500">No activity yet. Create a task to get started.</p>
      )}

      {!loading && activities.length > 0 && (
        <ol className="space-y-4">
          {activities.map((a, i) => {
            const config = typeConfig[a.type];
            const Icon = config.icon;
            return (
              <li key={a.id} className="flex gap-3">
                {/* Timeline line */}
                <div className="flex flex-col items-center">
                  <div className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gray-50 dark:bg-gray-800 ${config.color}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  {i < activities.length - 1 && (
                    <div className="mt-1 w-px flex-1 bg-gray-100 dark:bg-gray-700" />
                  )}
                </div>

                <div className="pb-4 min-w-0">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-medium">{a.user.name ?? "Someone"}</span>{" "}
                    <span>{config.label(a.meta as Record<string, unknown>)}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{timeAgo(a.createdAt)}</p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
