"use client";

import { useState, useMemo } from "react";
import { ChevronUp, ChevronDown, Search, X } from "lucide-react";
import TaskEditModal from "./TaskEditModal";
import type { TaskWithAssignee, Column, MemberUser, WorkspaceLabel } from "./TaskEditModal";

type SortField = "title" | "priority" | "status" | "dueDate" | "createdAt";
type SortDir = "asc" | "desc";
type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

const PRIORITY_ORDER: Record<string, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };
const PRIORITY_STYLE: Record<string, string> = {
  HIGH: "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400",
  MEDIUM: "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",
  LOW: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
};

function SortIndicator({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <span className="ml-1 text-gray-300 dark:text-gray-600">↕</span>;
  return dir === "asc" ? (
    <ChevronUp className="ml-1 inline h-3 w-3" />
  ) : (
    <ChevronDown className="ml-1 inline h-3 w-3" />
  );
}

export default function ListView({
  initialTasks,
  columns,
  members = [],
  workspaceLabels = [],
  workspaceId,
  projectKey,
}: {
  initialTasks: TaskWithAssignee[];
  columns: Column[];
  members?: MemberUser[];
  workspaceLabels?: WorkspaceLabel[];
  workspaceId?: string;
  projectKey?: string;
}) {
  const [tasks, setTasks] = useState<TaskWithAssignee[]>(initialTasks);
  const [editingTask, setEditingTask] = useState<TaskWithAssignee | null>(null);
  const [search, setSearch] = useState("");
  const [colFilter, setColFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "">("");
  const [assigneeFilter, setAssigneeFilter] = useState("");
  const [sort, setSort] = useState<{ field: SortField; dir: SortDir }>({
    field: "createdAt",
    dir: "desc",
  });

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  function getColumnColor(status: string) {
    return columns.find((c) => c.id === status)?.color ?? "#94a3b8";
  }
  function getColumnName(status: string) {
    return columns.find((c) => c.id === status)?.name ?? status;
  }

  function toggleSort(field: SortField) {
    setSort((s) =>
      s.field === field
        ? { field, dir: s.dir === "asc" ? "desc" : "asc" }
        : { field, dir: "asc" },
    );
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = tasks.filter((t) => {
      const tAny = t as unknown as { priority: string };
      if (q && !t.title.toLowerCase().includes(q)) return false;
      if (colFilter && t.status !== colFilter) return false;
      if (priorityFilter && tAny.priority !== priorityFilter) return false;
      if (assigneeFilter === "unassigned" && t.assigneeId) return false;
      if (assigneeFilter && assigneeFilter !== "unassigned" && t.assigneeId !== assigneeFilter)
        return false;
      return true;
    });

    list = [...list].sort((a, b) => {
      const aAny = a as unknown as { priority: string; number: number };
      const bAny = b as unknown as { priority: string; number: number };
      let cmp = 0;
      switch (sort.field) {
        case "title":
          cmp = a.title.localeCompare(b.title);
          break;
        case "priority":
          cmp =
            (PRIORITY_ORDER[aAny.priority] ?? 1) - (PRIORITY_ORDER[bAny.priority] ?? 1);
          break;
        case "status":
          cmp = getColumnName(a.status).localeCompare(getColumnName(b.status));
          break;
        case "dueDate": {
          const aD = a.dueDate ? new Date(a.dueDate as unknown as string).getTime() : Infinity;
          const bD = b.dueDate ? new Date(b.dueDate as unknown as string).getTime() : Infinity;
          cmp = aD - bD;
          break;
        }
        case "createdAt":
          cmp =
            new Date(a.createdAt as unknown as string).getTime() -
            new Date(b.createdAt as unknown as string).getTime();
          break;
      }
      return sort.dir === "asc" ? cmp : -cmp;
    });

    return list;
  }, [tasks, search, colFilter, priorityFilter, assigneeFilter, sort, columns]);

  const hasFilters = !!(search || colFilter || priorityFilter || assigneeFilter);

  function clearFilters() {
    setSearch("");
    setColFilter("");
    setPriorityFilter("");
    setAssigneeFilter("");
  }

  function SortHeader({
    field,
    children,
  }: {
    field: SortField;
    children: React.ReactNode;
  }) {
    return (
      <button
        onClick={() => toggleSort(field)}
        className="flex items-center text-xs font-semibold uppercase tracking-wide text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
      >
        {children}
        <SortIndicator active={sort.field === field} dir={sort.dir} />
      </button>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-48 max-w-xs flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks…"
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-8 pr-3 text-sm placeholder-gray-400 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
          />
        </div>

        <select
          value={colFilter}
          onChange={(e) => setColFilter(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-indigo-300 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
        >
          <option value="">All statuses</option>
          {columns.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | "")}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-indigo-300 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
        >
          <option value="">All priorities</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>

        {members.length > 0 && (
          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-indigo-300 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
          >
            <option value="">All assignees</option>
            <option value="unassigned">Unassigned</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        )}

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
            Clear
          </button>
        )}

        <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">
          {filtered.length} of {tasks.length} tasks
        </span>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <th className="px-4 py-3 text-left">
                  <SortHeader field="title">Title</SortHeader>
                </th>
                <th className="px-4 py-3 text-left">
                  <SortHeader field="status">Status</SortHeader>
                </th>
                <th className="px-4 py-3 text-left">
                  <SortHeader field="priority">Priority</SortHeader>
                </th>
                <th className="hidden px-4 py-3 text-left sm:table-cell">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                    Assignee
                  </span>
                </th>
                <th className="hidden px-4 py-3 text-left md:table-cell">
                  <SortHeader field="dueDate">Due</SortHeader>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-16 text-center text-sm text-gray-400 dark:text-gray-600"
                  >
                    {hasFilters ? "No tasks match the current filters." : "No tasks in this project yet."}
                  </td>
                </tr>
              ) : (
                filtered.map((task, i) => {
                  const tAny = task as unknown as { priority: string; number: number };
                  const color = getColumnColor(task.status);
                  const isLast = i === filtered.length - 1;
                  const rawDue = task.dueDate as unknown as string | null;
                  const isOverdue = rawDue && new Date(rawDue) < today;

                  return (
                    <tr
                      key={task.id}
                      onClick={() => setEditingTask(task)}
                      className={`cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                        !isLast ? "border-b border-gray-50 dark:border-gray-800/60" : ""
                      }`}
                    >
                      {/* Title */}
                      <td className="px-4 py-3">
                        <div className="flex min-w-0 items-center gap-2">
                          {projectKey && tAny.number > 0 && (
                            <span className="flex-shrink-0 font-mono text-xs text-gray-400 dark:text-gray-500">
                              {projectKey}-{tAny.number}
                            </span>
                          )}
                          <span className="line-clamp-1 text-sm font-medium text-gray-800 dark:text-gray-200">
                            {task.title}
                          </span>
                          {task.labels && task.labels.length > 0 && (
                            <div className="hidden flex-shrink-0 gap-1 lg:flex">
                              {task.labels.slice(0, 2).map((tl) => (
                                <span
                                  key={tl.label.id}
                                  className="rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                                  style={{
                                    backgroundColor: `${tl.label.color}22`,
                                    color: tl.label.color,
                                  }}
                                >
                                  {tl.label.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                          style={{ backgroundColor: color }}
                        >
                          {getColumnName(task.status)}
                        </span>
                      </td>

                      {/* Priority */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            PRIORITY_STYLE[tAny.priority] ?? PRIORITY_STYLE.LOW
                          }`}
                        >
                          {tAny.priority}
                        </span>
                      </td>

                      {/* Assignee */}
                      <td className="hidden px-4 py-3 sm:table-cell">
                        {task.assignee ? (
                          <div className="flex items-center gap-2">
                            {task.assignee.image ? (
                              <img
                                src={task.assignee.image}
                                alt={task.assignee.name ?? ""}
                                className="h-6 w-6 rounded-full object-cover"
                              />
                            ) : (
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-medium text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                                {(task.assignee.name ?? "?")[0].toUpperCase()}
                              </div>
                            )}
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {task.assignee.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-300 dark:text-gray-600">—</span>
                        )}
                      </td>

                      {/* Due date */}
                      <td className="hidden px-4 py-3 md:table-cell">
                        {rawDue ? (
                          <span
                            className={`text-sm ${
                              isOverdue
                                ? "font-medium text-red-500 dark:text-red-400"
                                : "text-gray-500 dark:text-gray-400"
                            }`}
                          >
                            {new Date(rawDue).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                            })}
                            {isOverdue && " ·⚠"}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-300 dark:text-gray-600">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingTask && (
        <TaskEditModal
          task={editingTask}
          members={members}
          workspaceLabels={workspaceLabels}
          workspaceId={workspaceId}
          columns={columns}
          onClose={() => setEditingTask(null)}
          onSave={(updated) => {
            setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
            setEditingTask(null);
          }}
        />
      )}
    </div>
  );
}
