"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Trash2 } from "lucide-react";
import type { Task } from "@prisma/client";

type TaskWithAssignee = Task & { assignee: { id: string; name: string | null; image: string | null } | null };

const priorityColor = { LOW: "bg-gray-100 text-gray-500", MEDIUM: "bg-amber-100 text-amber-600", HIGH: "bg-red-100 text-red-600" };

export default function TaskCard({
  task,
  setTasks,
}: {
  task: TaskWithAssignee;
  setTasks: React.Dispatch<React.SetStateAction<TaskWithAssignee[]>>;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };

  async function deleteTask() {
    await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="group flex flex-col gap-2 rounded-xl border border-gray-200 bg-white p-3 shadow-sm hover:border-indigo-200 cursor-grab active:cursor-grabbing"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-gray-800">{task.title}</p>
        <button
          onClick={deleteTask}
          className="hidden group-hover:block rounded p-0.5 hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex items-center justify-between">
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${priorityColor[task.priority]}`}>
          {task.priority}
        </span>
        {task.assignee?.image && (
          <img src={task.assignee.image} alt={task.assignee.name ?? ""} className="h-5 w-5 rounded-full" />
        )}
      </div>
    </div>
  );
}
