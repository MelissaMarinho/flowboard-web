"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Play, CheckCheck, Trash2, ChevronDown } from "lucide-react";
import type { TaskWithAssignee, Column, Sprint } from "./TaskEditModal";

type SprintWithCount = Sprint & { _count: { tasks: number } };

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function SprintStatusBadge({ status }: { status: Sprint["status"] }) {
  const config = {
    PLANNING: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
    ACTIVE: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    COMPLETED: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  };
  const label = { PLANNING: "Planning", ACTIVE: "Active", COMPLETED: "Completed" };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${config[status]}`}>
      {label[status]}
    </span>
  );
}

export default function SprintsView({
  projectId,
  projectKey,
  initialSprints,
  initialTasks,
  columns,
}: {
  projectId: string;
  projectKey?: string;
  initialSprints: SprintWithCount[];
  initialTasks: TaskWithAssignee[];
  columns: Column[];
}) {
  const [sprints, setSprints] = useState<SprintWithCount[]>(initialSprints);
  const [tasks, setTasks] = useState<TaskWithAssignee[]>(initialTasks);

  // Create sprint form state
  const [creatingOpen, setCreatingOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newGoal, setNewGoal] = useState("");
  const [newStart, setNewStart] = useState("");
  const [newEnd, setNewEnd] = useState("");
  const [creating, setCreating] = useState(false);

  // Sprint action errors
  const [actionError, setActionError] = useState("");

  async function createSprint(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim() || creating) return;
    setCreating(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/sprints`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          goal: newGoal.trim() || null,
          startDate: newStart || null,
          endDate: newEnd || null,
        }),
      });
      if (!res.ok) throw new Error();
      const created: SprintWithCount = await res.json();
      setSprints((prev) => [...prev, created]);
      setNewName("");
      setNewGoal("");
      setNewStart("");
      setNewEnd("");
      setCreatingOpen(false);
    } catch {
      // silently ignore
    } finally {
      setCreating(false);
    }
  }

  async function startSprint(sprintId: string) {
    setActionError("");
    const res = await fetch(`/api/projects/${projectId}/sprints/${sprintId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "ACTIVE" }),
    });
    if (res.status === 409) {
      const data = await res.json();
      setActionError((data as { error?: string }).error ?? "Cannot start sprint.");
      setTimeout(() => setActionError(""), 4000);
      return;
    }
    if (res.ok) {
      const updated: SprintWithCount = await res.json();
      setSprints((prev) => prev.map((s) => (s.id === sprintId ? updated : s)));
    }
  }

  async function completeSprint(sprintId: string) {
    const res = await fetch(`/api/projects/${projectId}/sprints/${sprintId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "COMPLETED" }),
    });
    if (res.ok) {
      const updated: SprintWithCount = await res.json();
      setSprints((prev) => prev.map((s) => (s.id === sprintId ? updated : s)));
    }
  }

  async function deleteSprint(sprintId: string) {
    setSprints((prev) => prev.filter((s) => s.id !== sprintId));
    // Unassign tasks locally
    setTasks((prev) =>
      prev.map((t) =>
        (t as unknown as { sprintId: string | null }).sprintId === sprintId
          ? ({ ...t, sprintId: null } as TaskWithAssignee)
          : t
      )
    );
    fetch(`/api/projects/${projectId}/sprints/${sprintId}`, { method: "DELETE" }).catch(() => {});
  }

  function assignToSprint(taskId: string, sprintId: string | null) {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? ({ ...t, sprintId } as TaskWithAssignee)
          : t
      )
    );
    // Update sprint task count optimistically
    setSprints((prev) =>
      prev.map((s) => {
        const taskCurrentSprint = (tasks.find((t) => t.id === taskId) as unknown as { sprintId: string | null } | undefined)?.sprintId;
        if (s.id === taskCurrentSprint) return { ...s, _count: { tasks: Math.max(0, s._count.tasks - 1) } };
        if (s.id === sprintId) return { ...s, _count: { tasks: s._count.tasks + 1 } };
        return s;
      })
    );
    fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sprintId }),
    }).catch(() => {});
  }

  const activeSprint = sprints.find((s) => s.status === "ACTIVE");
  const planningSprints = sprints.filter((s) => s.status === "PLANNING");
  const completedSprints = sprints.filter((s) => s.status === "COMPLETED");

  const getSprintTasks = (sprintId: string) =>
    tasks.filter((t) => (t as unknown as { sprintId: string | null }).sprintId === sprintId);

  const backlogTasks = tasks.filter(
    (t) => !(t as unknown as { sprintId: string | null }).sprintId
  );

  const availableSprintsForAssign = sprints.filter(
    (s) => s.status === "PLANNING" || s.status === "ACTIVE"
  );

  function getColumnName(status: string) {
    return columns.find((c) => c.id === status)?.name ?? status;
  }

  function getColumnColor(status: string) {
    return columns.find((c) => c.id === status)?.color ?? "#94a3b8";
  }

  function sprintProgress(sprintId: string) {
    const sprintTasks = getSprintTasks(sprintId);
    if (sprintTasks.length === 0) return { done: 0, total: 0, pct: 0 };
    // "done" = tasks in the last column (highest order)
    const lastColumnId = columns[columns.length - 1]?.id;
    const done = sprintTasks.filter((t) => t.status === lastColumnId).length;
    return { done, total: sprintTasks.length, pct: Math.round((done / sprintTasks.length) * 100) };
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href={`/dashboard/projects/${projectId}`}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to board
        </Link>
        <button
          onClick={() => setCreatingOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create sprint
        </button>
      </div>

      {/* Action error */}
      {actionError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
          {actionError}
        </div>
      )}

      {/* Create sprint form */}
      {creatingOpen && (
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/40 p-5 dark:border-indigo-800 dark:bg-indigo-950/30">
          <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">New sprint</h3>
          <form onSubmit={createSprint} className="space-y-3">
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Sprint name…"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-indigo-600 placeholder-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 dark:border-gray-700 dark:bg-gray-800 dark:text-indigo-400 dark:placeholder-gray-500"
            />
            <input
              value={newGoal}
              onChange={(e) => setNewGoal(e.target.value)}
              placeholder="Sprint goal (optional)…"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-indigo-600 placeholder-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 dark:border-gray-700 dark:bg-gray-800 dark:text-indigo-400 dark:placeholder-gray-500"
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">Start date</label>
                <input
                  type="date"
                  value={newStart}
                  onChange={(e) => setNewStart(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-indigo-600 focus:border-indigo-400 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-indigo-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">End date</label>
                <input
                  type="date"
                  value={newEnd}
                  onChange={(e) => setNewEnd(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-indigo-600 focus:border-indigo-400 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-indigo-400"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={!newName.trim() || creating}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
              >
                {creating ? "Creating…" : "Create"}
              </button>
              <button
                type="button"
                onClick={() => { setCreatingOpen(false); setNewName(""); setNewGoal(""); }}
                className="rounded-lg px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Active sprint */}
      {activeSprint && (() => {
        const { done, total, pct } = sprintProgress(activeSprint.id);
        const sprintTasks = getSprintTasks(activeSprint.id);
        return (
          <section>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">{activeSprint.name}</h2>
                <SprintStatusBadge status="ACTIVE" />
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {formatDate(activeSprint.startDate)} – {formatDate(activeSprint.endDate)}
                </span>
              </div>
              <button
                onClick={() => completeSprint(activeSprint.id)}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Complete sprint
              </button>
            </div>
            {activeSprint.goal && (
              <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">
                <span className="font-medium text-gray-700 dark:text-gray-300">Goal:</span> {activeSprint.goal}
              </p>
            )}
            {total > 0 && (
              <div className="mb-4">
                <div className="mb-1 flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
                  <span>{done}/{total} tasks done</span>
                  <span>{pct}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                  <div
                    className={`h-1.5 rounded-full transition-all ${pct === 100 ? "bg-green-500" : "bg-indigo-500"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )}
            <SprintTaskList
              tasks={sprintTasks}
              columns={columns}
              getColumnName={getColumnName}
              getColumnColor={getColumnColor}
              projectKey={projectKey}
            />
          </section>
        );
      })()}

      {/* Planning sprints */}
      {planningSprints.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
            Planning
          </h2>
          <div className="space-y-3">
            {planningSprints.map((sprint) => {
              const sprintTasks = getSprintTasks(sprint.id);
              return (
                <div key={sprint.id} className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-gray-900 dark:text-gray-100">{sprint.name}</span>
                      <SprintStatusBadge status="PLANNING" />
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {sprint.startDate || sprint.endDate
                          ? `${formatDate(sprint.startDate)} – ${formatDate(sprint.endDate)}`
                          : "No dates set"}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {sprintTasks.length} task{sprintTasks.length === 1 ? "" : "s"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => startSprint(sprint.id)}
                        className="flex items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-indigo-500 transition-colors"
                      >
                        <Play className="h-3 w-3" />
                        Start sprint
                      </button>
                      <button
                        onClick={() => deleteSprint(sprint.id)}
                        className="rounded-lg p-1 text-gray-400 hover:bg-red-50 hover:text-red-400 dark:hover:bg-red-950 dark:hover:text-red-400 transition-colors"
                        title="Delete sprint"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  {sprint.goal && (
                    <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">{sprint.goal}</p>
                  )}
                  {sprintTasks.length > 0 && (
                    <div className="mt-3">
                      <SprintTaskList
                        tasks={sprintTasks}
                        columns={columns}
                        getColumnName={getColumnName}
                        getColumnColor={getColumnColor}
                        projectKey={projectKey}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Completed sprints */}
      {completedSprints.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
            Completed
          </h2>
          <div className="space-y-2">
            {completedSprints.map((sprint) => {
              const { done, total } = sprintProgress(sprint.id);
              return (
                <div key={sprint.id} className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{sprint.name}</span>
                    <SprintStatusBadge status="COMPLETED" />
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {done}/{total} tasks done
                    </span>
                  </div>
                  <button
                    onClick={() => deleteSprint(sprint.id)}
                    className="rounded p-1 text-gray-300 hover:text-red-400 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Backlog */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
            Backlog
            <span className="ml-2 font-normal text-gray-400 dark:text-gray-500">
              ({backlogTasks.length})
            </span>
          </h2>
        </div>
        {backlogTasks.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500">All tasks are assigned to sprints.</p>
        ) : (
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 overflow-hidden">
            {backlogTasks.map((task, i) => {
              const taskWithSprint = task as unknown as TaskWithAssignee & { sprintId: string | null; number: number };
              return (
                <div
                  key={task.id}
                  className={`flex items-center gap-3 px-4 py-3 ${i !== backlogTasks.length - 1 ? "border-b border-gray-50 dark:border-gray-800" : ""}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {projectKey && taskWithSprint.number > 0 && (
                        <span className="font-mono text-xs text-gray-400 dark:text-gray-500">
                          {projectKey}-{taskWithSprint.number}
                        </span>
                      )}
                      <span className="truncate text-sm text-gray-800 dark:text-gray-100">{task.title}</span>
                    </div>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-2">
                    <span
                      className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
                      style={{ backgroundColor: getColumnColor(task.status) }}
                    >
                      {getColumnName(task.status)}
                    </span>
                    {availableSprintsForAssign.length > 0 && (
                      <div className="relative">
                        <select
                          value=""
                          onChange={(e) => {
                            if (e.target.value) assignToSprint(task.id, e.target.value);
                          }}
                          className="rounded-lg border border-gray-200 bg-white py-1 pl-2 pr-6 text-xs text-indigo-600 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-indigo-400 appearance-none cursor-pointer"
                        >
                          <option value="">Add to sprint</option>
                          {availableSprintsForAssign.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}{s.status === "ACTIVE" ? " 🟢" : ""}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-400" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function SprintTaskList({
  tasks,
  getColumnName,
  getColumnColor,
  projectKey,
}: {
  tasks: TaskWithAssignee[];
  columns: Column[];
  getColumnName: (status: string) => string;
  getColumnColor: (status: string) => string;
  projectKey?: string;
}) {
  if (tasks.length === 0) {
    return <p className="text-sm text-gray-400 dark:text-gray-500">No tasks in this sprint yet.</p>;
  }
  return (
    <ul className="space-y-1.5">
      {tasks.map((task) => {
        const t = task as unknown as TaskWithAssignee & { number: number };
        return (
          <li key={task.id} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <span
              className="h-2 w-2 flex-shrink-0 rounded-full"
              style={{ backgroundColor: getColumnColor(task.status) }}
            />
            <span className="flex-1 truncate text-sm text-gray-700 dark:text-gray-300">
              {projectKey && t.number > 0 && (
                <span className="mr-1.5 font-mono text-xs text-gray-400 dark:text-gray-500">
                  {projectKey}-{t.number}
                </span>
              )}
              {task.title}
            </span>
            <span
              className="flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium text-white"
              style={{ backgroundColor: getColumnColor(task.status) }}
            >
              {getColumnName(task.status)}
            </span>
            {task.assignee?.image ? (
              <img src={task.assignee.image} alt={task.assignee.name ?? ""} className="h-5 w-5 flex-shrink-0 rounded-full" />
            ) : task.assignee ? (
              <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-medium text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                {task.assignee.name?.[0]?.toUpperCase() ?? "?"}
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
