"use client";

import { useState, useEffect } from "react";
import { DndContext, DragEndEvent, PointerSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Search, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import KanbanColumn from "./KanbanColumn";
import type { Task } from "@prisma/client";
import type { MemberUser, WorkspaceLabel, TaskWithAssignee } from "./TaskEditModal";

const COLUMNS = [
  { id: "TODO", label: "To Do" },
  { id: "IN_PROGRESS", label: "In Progress" },
  { id: "DONE", label: "Done" },
] as const;

type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

export default function KanbanBoard({
  projectId,
  workspaceId,
  initialTasks,
  members = [],
  workspaceLabels = [],
}: {
  projectId: string;
  workspaceId?: string;
  initialTasks: TaskWithAssignee[];
  members?: MemberUser[];
  workspaceLabels?: WorkspaceLabel[];
}) {
  const [tasks, setTasks] = useState<TaskWithAssignee[]>(initialTasks);
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "">("");
  const [labelFilter, setLabelFilter] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  // Supabase Realtime — live updates from other users
  useEffect(() => {
    const channel = supabase
      .channel(`project-${projectId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "Task", filter: `projectId=eq.${projectId}` },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setTasks((prev) => [...prev, payload.new as TaskWithAssignee]);
          } else if (payload.eventType === "UPDATE") {
            setTasks((prev) =>
              prev.map((t) => (t.id === payload.new.id ? { ...t, ...payload.new } : t))
            );
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

  function clearFilters() {
    setSearch("");
    setPriorityFilter("");
    setLabelFilter("");
  }

  const hasFilters = search.trim() !== "" || priorityFilter !== "" || labelFilter !== "";

  const filteredTasks = tasks.filter((t) => {
    if (search.trim() && !t.title.toLowerCase().includes(search.trim().toLowerCase())) return false;
    if (priorityFilter && t.priority !== priorityFilter) return false;
    if (labelFilter && !t.labels?.some((tl) => tl.label.id === labelFilter)) return false;
    return true;
  });

  const hiddenCount = tasks.length - filteredTasks.length;

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks…"
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-8 pr-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
          />
        </div>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | "")}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
        >
          <option value="">All priorities</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>

        {workspaceLabels.length > 0 && (
          <select
            value={labelFilter}
            onChange={(e) => setLabelFilter(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
          >
            <option value="">All labels</option>
            {workspaceLabels.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
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
            {hiddenCount > 0 && (
              <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                {hiddenCount} hidden
              </span>
            )}
          </button>
        )}
      </div>

      {/* Kanban columns */}
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {COLUMNS.map((col) => {
            const colTasks = filteredTasks.filter((t) => t.status === col.id);
            return (
              <SortableContext
                key={col.id}
                id={col.id}
                items={colTasks.map((t) => t.id)}
                strategy={verticalListSortingStrategy}
              >
                <KanbanColumn
                  column={col}
                  tasks={colTasks}
                  projectId={projectId}
                  members={members}
                  workspaceLabels={workspaceLabels}
                  workspaceId={workspaceId}
                  setTasks={setTasks}
                />
              </SortableContext>
            );
          })}
        </div>
      </DndContext>
    </div>
  );
}
