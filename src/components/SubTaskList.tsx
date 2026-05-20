"use client";

import { useState, useEffect } from "react";
import { Plus, X } from "lucide-react";

interface SubTask {
  id: string;
  title: string;
  done: boolean;
}

export default function SubTaskList({ taskId }: { taskId: string }) {
  const [subTasks, setSubTasks] = useState<SubTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/tasks/${taskId}/subtasks`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setSubTasks(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [taskId]);

  const total = subTasks.length;
  const done = subTasks.filter((s) => s.done).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  async function toggleDone(sub: SubTask) {
    const next = !sub.done;
    setSubTasks((prev) => prev.map((s) => (s.id === sub.id ? { ...s, done: next } : s)));
    fetch(`/api/tasks/${taskId}/subtasks/${sub.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: next }),
    }).catch(() => {});
  }

  async function addSubTask(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = newTitle.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/subtasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trimmed }),
      });
      if (!res.ok) throw new Error();
      const created: SubTask = await res.json();
      setSubTasks((prev) => [...prev, created]);
      setNewTitle("");
      setAdding(false);
    } catch {
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteSubTask(id: string) {
    setSubTasks((prev) => prev.filter((s) => s.id !== id));
    fetch(`/api/tasks/${taskId}/subtasks/${id}`, { method: "DELETE" }).catch(() => {});
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
            Sub-tasks
          </h2>
          {total > 0 && (
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {done}/{total}
            </span>
          )}
        </div>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </button>
        )}
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
          <div
            className={`h-1.5 rounded-full transition-all duration-300 ${pct === 100 ? "bg-green-500" : "bg-indigo-500"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="h-4 w-4 animate-pulse rounded bg-gray-100 dark:bg-gray-700" />
              <div className="h-3 flex-1 animate-pulse rounded bg-gray-100 dark:bg-gray-700" />
            </div>
          ))}
        </div>
      )}

      {/* Sub-task list */}
      {!loading && (
        <ul className="space-y-2">
          {subTasks.map((sub) => (
            <li key={sub.id} className="group flex items-center gap-2.5">
              <input
                type="checkbox"
                checked={sub.done}
                onChange={() => toggleDone(sub)}
                className="h-4 w-4 flex-shrink-0 cursor-pointer rounded border-gray-300 accent-indigo-600"
              />
              <span
                className={`flex-1 text-sm leading-snug ${
                  sub.done
                    ? "text-gray-400 line-through dark:text-gray-500"
                    : "text-gray-700 dark:text-gray-300"
                }`}
              >
                {sub.title}
              </span>
              <button
                onClick={() => deleteSubTask(sub.id)}
                className="hidden flex-shrink-0 rounded p-0.5 text-gray-300 hover:bg-red-50 hover:text-red-400 group-hover:block dark:text-gray-600 dark:hover:bg-red-950 dark:hover:text-red-400 transition-colors"
                title="Delete sub-task"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}

          {total === 0 && !adding && (
            <p className="text-sm text-gray-400 dark:text-gray-500">
              No sub-tasks yet.
            </p>
          )}
        </ul>
      )}

      {/* Add form */}
      {adding && (
        <form onSubmit={addSubTask} className="mt-3 flex gap-2">
          <input
            autoFocus
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setAdding(false);
                setNewTitle("");
              }
            }}
            placeholder="Sub-task title…"
            className="flex-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm text-indigo-600 placeholder-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 dark:border-gray-700 dark:bg-gray-800 dark:text-indigo-400 dark:placeholder-gray-500"
          />
          <button
            type="submit"
            disabled={submitting || !newTitle.trim()}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
          >
            {submitting ? "Adding…" : "Add"}
          </button>
          <button
            type="button"
            onClick={() => { setAdding(false); setNewTitle(""); }}
            className="rounded-lg px-2 py-1.5 text-xs text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
        </form>
      )}
    </div>
  );
}
