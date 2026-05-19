"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";
import type { Task } from "@prisma/client";
import TaskEditModal, { type MemberUser } from "./TaskEditModal";

type TaskWithAssignee = Task & { assignee: { id: string; name: string | null; image: string | null } | null };

const priorityColor = {
  LOW: "bg-gray-100 text-gray-500",
  MEDIUM: "bg-amber-100 text-amber-600",
  HIGH: "bg-red-100 text-red-600",
};

function formatDueDate(date: Date | string | null): { label: string; overdue: boolean } | null {
  if (!date) return null;
  const d = new Date(date);
  const overdue = d < new Date();
  const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return { label, overdue };
}

export default function TaskCard({
  task,
  members = [],
  setTasks,
}: {
  task: TaskWithAssignee;
  members?: MemberUser[];
  setTasks: React.Dispatch<React.SetStateAction<TaskWithAssignee[]>>;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id });

  const [editing, setEditing] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  async function deleteTask(e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
    } catch {
      // silently ignore
    }
  }

  const due = formatDueDate(task.dueDate);

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        onClick={() => setEditing(true)}
        className="group flex cursor-pointer flex-col gap-2 rounded-xl border border-gray-200 bg-white p-3 shadow-sm hover:border-indigo-200 transition-colors"
      >
        <div className="flex items-start gap-2">
          <span
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            className="mt-0.5 flex-shrink-0 cursor-grab text-gray-300 hover:text-gray-400 active:cursor-grabbing"
          >
            <GripVertical className="h-4 w-4" />
          </span>

          <p className="flex-1 text-sm font-medium leading-snug text-gray-800">{task.title}</p>

          <button
            onClick={deleteTask}
            className="hidden flex-shrink-0 rounded p-0.5 text-gray-400 hover:bg-red-50 hover:text-red-500 group-hover:block transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>

        {task.description && (
          <p className="ml-6 line-clamp-2 text-xs text-gray-400">{task.description}</p>
        )}

        <div className="ml-6 flex items-center justify-between">
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${priorityColor[task.priority]}`}>
            {task.priority}
          </span>
          <div className="flex items-center gap-2">
            {due && (
              <span className={`text-xs ${due.overdue ? "font-medium text-red-500" : "text-gray-400"}`}>
                {due.overdue ? "Overdue · " : ""}{due.label}
              </span>
            )}
            {task.assignee?.image && (
              <img
                src={task.assignee.image}
                alt={task.assignee.name ?? ""}
                title={task.assignee.name ?? ""}
                className="h-5 w-5 rounded-full"
              />
            )}
            {task.assignee && !task.assignee.image && (
              <div
                title={task.assignee.name ?? ""}
                className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-xs font-medium text-indigo-700"
              >
                {task.assignee.name?.[0]?.toUpperCase() ?? "?"}
              </div>
            )}
          </div>
        </div>
      </div>

      {editing && (
        <TaskEditModal
          task={task}
          members={members}
          onClose={() => setEditing(false)}
          onSave={(updated) => setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))}
        />
      )}
    </>
  );
}
