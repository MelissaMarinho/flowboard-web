"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Pencil, PlusCircle, Trash2, Sparkles } from "lucide-react";
import TaskEditModal from "./TaskEditModal";
import TaskComments from "./TaskComments";
import SubTaskList from "./SubTaskList";
import LabelBadge from "./LabelBadge";
import type { TaskWithAssignee, MemberUser, WorkspaceLabel, Column } from "./TaskEditModal";

type ActivityType = "TASK_CREATED" | "TASK_UPDATED" | "TASK_DELETED" | "AI_SUMMARY_GENERATED";

export interface ActivityEntry {
  id: string;
  type: ActivityType;
  meta: Record<string, unknown>;
  createdAt: string;
  user: { id: string; name: string | null; image: string | null };
}

const priorityColor: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  MEDIUM: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  HIGH: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
};

const activityConfig: Record<ActivityType, {
  icon: React.ElementType;
  color: string;
  label: (meta: Record<string, unknown>) => string;
}> = {
  TASK_CREATED: {
    icon: PlusCircle,
    color: "text-green-500",
    label: () => "created this task",
  },
  TASK_UPDATED: {
    icon: Pencil,
    color: "text-indigo-500",
    label: (m) => {
      const changes = (m.changes as string[] | undefined) ?? [];
      return changes.length ? `updated — ${changes.join(", ")}` : "updated this task";
    },
  },
  TASK_DELETED: {
    icon: Trash2,
    color: "text-red-400",
    label: () => "deleted this task",
  },
  AI_SUMMARY_GENERATED: {
    icon: Sparkles,
    color: "text-violet-500",
    label: () => "generated an AI summary",
  },
};

function formatDate(val: unknown): string {
  if (!val) return "—";
  const d = new Date(val as string | Date);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return formatDate(dateStr);
}

export default function TaskDetailClient({
  task: initialTask,
  activities,
  members,
  workspaceLabels,
  workspaceId,
  projectId,
  currentUserId,
  projectKey,
  taskNumber,
  columns,
}: {
  task: TaskWithAssignee;
  activities: ActivityEntry[];
  members: MemberUser[];
  workspaceLabels: WorkspaceLabel[];
  workspaceId: string;
  projectId: string;
  currentUserId: string;
  projectKey?: string;
  taskNumber?: number;
  columns: Column[];
}) {
  const [task, setTask] = useState<TaskWithAssignee>(initialTask);
  const [editing, setEditing] = useState(false);
  const currentColumn = columns.find((c) => c.id === task.status);

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <Link
          href={`/dashboard/projects/${projectId}`}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to project
        </Link>
        <button
          onClick={() => setEditing(true)}
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </button>
      </div>

      {/* Title + labels */}
      <div>
        {projectKey && taskNumber && taskNumber > 0 && (
          <p className="mb-1 font-mono text-sm font-medium text-indigo-500 dark:text-indigo-400">
            {projectKey}-{taskNumber}
          </p>
        )}
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{task.title}</h1>
        {task.labels && task.labels.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {task.labels.map((tl) => (
              <LabelBadge key={tl.label.id} name={tl.label.name} color={tl.label.color} />
            ))}
          </div>
        )}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left — description + activity */}
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
              Description
            </h2>
            {task.description ? (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                {task.description}
              </p>
            ) : (
              <p className="text-sm italic text-gray-400 dark:text-gray-500">No description provided.</p>
            )}
          </div>

          <SubTaskList taskId={task.id} />

          <TaskComments taskId={task.id} currentUserId={currentUserId} />

          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
              Activity
            </h2>
            {activities.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500">No activity recorded yet.</p>
            ) : (
              <ol className="space-y-1">
                {activities.map((a, i) => {
                  const config = activityConfig[a.type];
                  if (!config) return null;
                  const Icon = config.icon;
                  return (
                    <li key={a.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div
                          className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gray-50 dark:bg-gray-800 ${config.color}`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        {i < activities.length - 1 && (
                          <div className="mt-1 w-px flex-1 bg-gray-100 dark:bg-gray-700" />
                        )}
                      </div>
                      <div className="pb-4 min-w-0">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          <span className="font-medium">{a.user.name ?? "Someone"}</span>{" "}
                          {config.label(a.meta)}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                          {timeAgo(a.createdAt)}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </div>

        {/* Right — metadata sidebar */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900 h-fit space-y-5">
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
              Status
            </p>
            <span
              className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
              style={{ backgroundColor: currentColumn?.color ?? "#94a3b8" }}
            >
              {currentColumn?.name ?? task.status}
            </span>
          </div>

          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
              Priority
            </p>
            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${priorityColor[task.priority]}`}>
              {task.priority.charAt(0) + task.priority.slice(1).toLowerCase()}
            </span>
          </div>

          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
              Assignee
            </p>
            {task.assignee ? (
              <div className="flex items-center gap-2">
                {task.assignee.image ? (
                  <img
                    src={task.assignee.image}
                    alt={task.assignee.name ?? ""}
                    className="h-6 w-6 rounded-full"
                  />
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-medium text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                    {task.assignee.name?.[0]?.toUpperCase() ?? "?"}
                  </div>
                )}
                <span className="text-sm text-gray-700 dark:text-gray-300">{task.assignee.name}</span>
              </div>
            ) : (
              <span className="text-sm text-gray-400 dark:text-gray-500">Unassigned</span>
            )}
          </div>

          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
              Due Date
            </p>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {task.dueDate ? formatDate(task.dueDate) : (
                <span className="text-gray-400 dark:text-gray-500">No due date</span>
              )}
            </span>
          </div>

          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
              Created
            </p>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {formatDate((task as unknown as { createdAt: unknown }).createdAt)}
            </span>
          </div>
        </div>
      </div>

      {editing && (
        <TaskEditModal
          task={task}
          members={members}
          workspaceLabels={workspaceLabels}
          workspaceId={workspaceId}
          columns={columns}
          onClose={() => setEditing(false)}
          onSave={(updated) => setTask(updated)}
        />
      )}
    </div>
  );
}
