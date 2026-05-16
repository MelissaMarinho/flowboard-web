"use client";

import { useState, useEffect } from "react";
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { supabase } from "@/lib/supabase";
import KanbanColumn from "./KanbanColumn";
import type { Task } from "@prisma/client";

const COLUMNS = [
  { id: "TODO", label: "To Do" },
  { id: "IN_PROGRESS", label: "In Progress" },
  { id: "DONE", label: "Done" },
] as const;

type TaskWithAssignee = Task & { assignee: { id: string; name: string | null; image: string | null } | null };

export default function KanbanBoard({
  projectId,
  initialTasks,
}: {
  projectId: string;
  initialTasks: TaskWithAssignee[];
}) {
  const [tasks, setTasks] = useState<TaskWithAssignee[]>(initialTasks);

  const sensors = useSensors(useSensor(PointerSensor));

  // Supabase Realtime — live updates from other users
  useEffect(() => {
    const channel = supabase
      .channel(`project-${projectId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "Task", filter: `projectId=eq.${projectId}` },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setTasks((prev) => [...prev, payload.new as TaskWithAssignee]);
          } else if (payload.eventType === "UPDATE") {
            setTasks((prev) => prev.map((t) => (t.id === payload.new.id ? { ...t, ...payload.new } : t)));
          } else if (payload.eventType === "DELETE") {
            setTasks((prev) => prev.filter((t) => t.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [projectId]);

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const newStatus = over.id as Task["status"];
    setTasks((prev) => prev.map((t) => (t.id === active.id ? { ...t, status: newStatus } : t)));

    await fetch(`/api/tasks/${active.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id);
          return (
            <SortableContext key={col.id} id={col.id} items={colTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
              <KanbanColumn column={col} tasks={colTasks} projectId={projectId} setTasks={setTasks} />
            </SortableContext>
          );
        })}
      </div>
    </DndContext>
  );
}
