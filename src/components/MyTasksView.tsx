"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import TaskEditModal from "./TaskEditModal";
import type { TaskWithAssignee, Column, WorkspaceLabel } from "./TaskEditModal";

type TaskWithProject = TaskWithAssignee & {
  project: { id: string; name: string; key: string | null };
};

type FilterTab = "all" | "overdue" | "soon" | "nodate";

const PRIORITY_STYLE: Record<string, string> = {
  HIGH: "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400",
  MEDIUM: "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",
  LOW: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
};

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export default function MyTasksView({
  initialTasks,
  columnsByProject,
  workspaceLabels = [],
}: {
  initialTasks: TaskWithProject[];
  columnsByProject: Record<string, Column[]>;
  workspaceLabels?: WorkspaceLabel[];
}) {
  const [tasks, setTasks] = useState<TaskWithProject[]>(initialTasks);
  const [editingTask, setEditingTask] = useState<TaskWithAssignee | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  const today = useMemo(() => startOfDay(new Date()), []);
  const weekEnd = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() + 7);
    return d;
  }, [today]);

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      const rawDue = t.dueDate as unknown as string | null;
      const due = rawDue ? startOfDay(new Date(rawDue)) : null;
      if (activeTab === "overdue") return due !== null && due < today;
      if (activeTab === "soon") return due !== null && due >= today && due <= weekEnd;
      if (activeTab === "nodate") return due === null;
      return true;
    });
  }, [tasks, activeTab, today, weekEnd]);

  // Group by project
  const grouped = useMemo(() => {
    const map = new Map<string, { project: TaskWithProject["project"]; tasks: TaskWithProject[] }>();
    for (const t of filtered) {
      if (!map.has(t.projectId)) map.set(t.projectId, { project: t.project, tasks: [] });
      map.get(t.projectId)!.tasks.push(t);
    }
    return [...map.values()];
  }, [filtered]);

  const counts = useMemo(() => {
    const all = tasks.length;
    const overdue = tasks.filter((t) => {
      const raw = t.dueDate as unknown as string | null;
      return raw && startOfDay(new Date(raw)) < today;
    }).length;
    const soon = tasks.filter((t) => {
      const raw = t.dueDate as unknown as string | null;
      if (!raw) return false;
      const d = startOfDay(new Date(raw));
      return d >= today && d <= weekEnd;
    }).length;
    const nodate = tasks.filter((t) => !t.dueDate).length;
    return { all, overdue, soon, nodate };
  }, [tasks, today, weekEnd]);

  const TABS: { key: FilterTab; label: string; count: number }[] = [
    { key: "all", label: "All", count: counts.all },
    { key: "overdue", label: "Overdue", count: counts.overdue },
    { key: "soon", label: "Due this week", count: counts.soon },
    { key: "nodate", label: "No due date", count: counts.nodate },
  ];

  function getColumnColor(projectId: string, status: string) {
    return columnsByProject[projectId]?.find((c) => c.id === status)?.color ?? "#94a3b8";
  }
  function getColumnName(projectId: string, status: string) {
    return columnsByProject[projectId]?.find((c) => c.id === status)?.name ?? status;
  }

  const editingColumns = editingTask
    ? columnsByProject[(editingTask as TaskWithProject).projectId] ?? []
    : [];

  return (
    <div className="space-y-6">
      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-indigo-600 text-white"
                : "border border-gray-200 bg-white text-gray-600 hover:border-indigo-300 hover:text-indigo-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:border-indigo-600 dark:hover:text-indigo-400"
            }`}
          >
            {tab.label}
            <span
              className={`rounded-full px-1.5 py-0.5 text-xs ${
                activeTab === tab.key
                  ? "bg-indigo-500 text-white"
                  : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Task groups */}
      {grouped.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white py-16 dark:border-gray-700 dark:bg-gray-900">
          <p className="text-sm text-gray-400 dark:text-gray-600">
            {activeTab === "all" ? "No tasks assigned to you." : "No tasks in this category."}
          </p>
        </div>
      ) : (
        grouped.map(({ project, tasks: groupTasks }) => (
          <div
            key={project.id}
            className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
          >
            {/* Project header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3 dark:border-gray-800">
              <Link
                href={`/dashboard/projects/${project.id}`}
                className="text-sm font-semibold text-gray-800 hover:text-indigo-600 dark:text-gray-200 dark:hover:text-indigo-400 transition-colors"
              >
                {project.name}
              </Link>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {groupTasks.length} task{groupTasks.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Task rows */}
            {groupTasks.map((task, i) => {
              const tAny = task as unknown as { priority: string; number: number; points?: number | null };
              const color = getColumnColor(task.projectId, task.status);
              const rawDue = task.dueDate as unknown as string | null;
              const isOverdue = rawDue && startOfDay(new Date(rawDue)) < today;
              const isLast = i === groupTasks.length - 1;

              return (
                <button
                  key={task.id}
                  onClick={() => setEditingTask(task)}
                  className={`flex w-full items-center gap-4 px-5 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                    !isLast ? "border-b border-gray-50 dark:border-gray-800/60" : ""
                  }`}
                >
                  {/* Title */}
                  <span className="min-w-0 flex-1">
                    {project.key && tAny.number > 0 && (
                      <Link
                        href={`/dashboard/projects/${task.projectId}/tasks/${task.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="mr-1.5 font-mono text-xs font-medium text-indigo-500 hover:underline dark:text-indigo-400"
                      >
                        {project.key}-{tAny.number}
                      </Link>
                    )}
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      {task.title}
                    </span>
                  </span>

                  {/* Status */}
                  <span
                    className="hidden flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium text-white sm:inline-flex"
                    style={{ backgroundColor: color }}
                  >
                    {getColumnName(task.projectId, task.status)}
                  </span>

                  {/* Priority */}
                  <span
                    className={`hidden flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium md:inline-flex ${
                      PRIORITY_STYLE[tAny.priority] ?? PRIORITY_STYLE.LOW
                    }`}
                  >
                    {tAny.priority}
                  </span>

                  {/* Points */}
                  {tAny.points != null && (
                    <span className="hidden flex-shrink-0 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 lg:inline-flex">
                      {tAny.points}pt
                    </span>
                  )}

                  {/* Due date */}
                  {rawDue ? (
                    <span
                      className={`flex-shrink-0 text-xs ${
                        isOverdue
                          ? "font-medium text-red-500 dark:text-red-400"
                          : "text-gray-400 dark:text-gray-500"
                      }`}
                    >
                      {new Date(rawDue).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                      {isOverdue && " ⚠"}
                    </span>
                  ) : (
                    <span className="flex-shrink-0 text-xs text-gray-300 dark:text-gray-600">—</span>
                  )}
                </button>
              );
            })}
          </div>
        ))
      )}

      {editingTask && (
        <TaskEditModal
          task={editingTask}
          columns={editingColumns}
          workspaceLabels={workspaceLabels}
          onClose={() => setEditingTask(null)}
          onSave={(updated) => {
            setTasks((prev) =>
              prev.map((t) =>
                t.id === updated.id ? { ...updated, project: t.project } : t,
              ),
            );
            setEditingTask(null);
          }}
        />
      )}
    </div>
  );
}
