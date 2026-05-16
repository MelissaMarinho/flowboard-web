"use client";

import { useDroppable } from "@dnd-kit/core";
import { useState } from "react";
import { Plus } from "lucide-react";
import TaskCard from "./TaskCard";
import type { Task } from "@prisma/client";

type TaskWithAssignee = Task & { assignee: { id: string; name: string | null; image: string | null } | null };

interface Column { id: string; label: string }

export default function KanbanColumn({
  column,
  tasks,
  projectId,
  setTasks,
}: {
  column: Column;
  tasks: TaskWithAssignee[];
  projectId: string;
  setTasks: React.Dispatch<React.SetStateAction<TaskWithAssignee[]>>;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, projectId, status: column.id }),
    });
    const task = await res.json();
    setTasks((prev) => [...prev, task]);
    setTitle("");
    setAdding(false);
  }

  const colorMap: Record<string, string> = {
    TODO: "bg-gray-100 text-gray-600",
    IN_PROGRESS: "bg-amber-100 text-amber-700",
    DONE: "bg-green-100 text-green-700",
  };

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-2xl border bg-white p-4 transition-colors ${isOver ? "border-indigo-300 bg-indigo-50" : "border-gray-200"}`}
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${colorMap[column.id]}`}>
            {column.label}
          </span>
          <span className="text-xs text-gray-400">{tasks.length}</span>
        </div>
        <button onClick={() => setAdding(true)} className="rounded p-1 hover:bg-gray-100 transition-colors">
          <Plus className="h-4 w-4 text-gray-500" />
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} setTasks={setTasks} />
        ))}
      </div>

      {adding && (
        <form onSubmit={addTask} className="mt-2">
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title…"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
          <div className="mt-2 flex gap-2">
            <button type="submit" className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500">
              Add
            </button>
            <button type="button" onClick={() => setAdding(false)} className="rounded-lg px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100">
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
