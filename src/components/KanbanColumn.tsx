"use client";

import { useDroppable } from "@dnd-kit/core";
import { useState } from "react";
import { Plus } from "lucide-react";
import TaskCard from "./TaskCard";
import type { Task } from "@prisma/client";
import type { MemberUser, WorkspaceLabel, TaskWithAssignee } from "./TaskEditModal";

interface Column {
  id: string;
  label: string;
}

const colorMap: Record<string, string> = {
  TODO: "bg-gray-100 text-gray-600",
  IN_PROGRESS: "bg-amber-100 text-amber-700",
  DONE: "bg-green-100 text-green-700",
};

const PRIORITIES = ["LOW", "MEDIUM", "HIGH"] as const;

export default function KanbanColumn({
  column,
  tasks,
  projectId,
  members = [],
  workspaceLabels = [],
  workspaceId,
  setTasks,
}: {
  column: Column;
  tasks: TaskWithAssignee[];
  projectId: string;
  members?: MemberUser[];
  workspaceLabels?: WorkspaceLabel[];
  workspaceId?: string;
  setTasks: React.Dispatch<React.SetStateAction<TaskWithAssignee[]>>;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Task["priority"]>("MEDIUM");
  const [assigneeId, setAssigneeId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          projectId,
          status: column.id,
          priority,
          assigneeId: assigneeId || null,
          dueDate: dueDate || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to create task");
      const task: TaskWithAssignee = await res.json();
      setTasks((prev) => [...prev, task]);
      cancel();
    } catch {
      setError("Failed to add task. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function cancel() {
    setAdding(false);
    setTitle("");
    setPriority("MEDIUM");
    setAssigneeId("");
    setDueDate("");
    setError("");
  }

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-2xl border p-4 transition-colors ${
        isOver
          ? "border-indigo-300 bg-indigo-50 dark:border-indigo-700 dark:bg-indigo-950"
          : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
      }`}
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${colorMap[column.id]}`}>
            {column.label}
          </span>
          <span className="text-xs text-gray-400 dark:text-gray-500">{tasks.length}</span>
        </div>
        <button
          onClick={() => setAdding(true)}
          className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <Plus className="h-4 w-4 text-gray-500" />
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} members={members} workspaceLabels={workspaceLabels} workspaceId={workspaceId} setTasks={setTasks} />
        ))}

        {tasks.length === 0 && !adding && (
          <button
            onClick={() => setAdding(true)}
            className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-6 text-center hover:border-indigo-200 hover:bg-indigo-50/40 dark:border-gray-700 dark:hover:border-indigo-700 dark:hover:bg-indigo-950/40 transition-colors group"
          >
            <Plus className="h-4 w-4 text-gray-300 group-hover:text-indigo-400 transition-colors" />
            <span className="mt-1 text-xs text-gray-400 group-hover:text-indigo-500 transition-colors">
              Add a task
            </span>
          </button>
        )}
      </div>

      {adding && (
        <form onSubmit={addTask} className="mt-3 space-y-2">
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title…"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-indigo-600 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-indigo-400 dark:placeholder-gray-500"
          />

          <div className="grid grid-cols-2 gap-2">
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Task["priority"])}
              className="w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs text-indigo-600 focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-indigo-400"
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p.charAt(0) + p.slice(1).toLowerCase()}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs text-indigo-600 focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-indigo-400"
            />
          </div>

          {members.length > 0 && (
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs text-indigo-600 focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-indigo-400"
            >
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name ?? m.id}
                </option>
              ))}
            </select>
          )}

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting || !title.trim()}
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
            >
              {submitting ? "Adding…" : "Add"}
            </button>
            <button
              type="button"
              onClick={cancel}
              className="rounded-lg px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
