"use client";

import { useState, useEffect } from "react";
import {
  DndContext, DragEndEvent, DragStartEvent, DragOverlay,
  PointerSensor, TouchSensor, useSensor, useSensors,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus, Search, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import KanbanColumn from "./KanbanColumn";
import type { MemberUser, WorkspaceLabel, TaskWithAssignee, Column } from "./TaskEditModal";

type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

const COLUMN_COLORS = [
  "#94a3b8", "#f59e0b", "#22c55e", "#6366f1",
  "#8b5cf6", "#ec4899", "#ef4444", "#14b8a6", "#0ea5e9",
];

export default function KanbanBoard({
  projectId,
  workspaceId,
  projectKey,
  initialTasks,
  initialColumns,
  members = [],
  workspaceLabels = [],
}: {
  projectId: string;
  workspaceId?: string;
  projectKey?: string;
  initialTasks: TaskWithAssignee[];
  initialColumns: Column[];
  members?: MemberUser[];
  workspaceLabels?: WorkspaceLabel[];
}) {
  const [tasks, setTasks] = useState<TaskWithAssignee[]>(initialTasks);
  const [columns, setColumns] = useState<Column[]>(initialColumns);
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "">("");
  const [labelFilter, setLabelFilter] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [columnErrors, setColumnErrors] = useState<Record<string, string>>({});

  // Add column state
  const [addingColumn, setAddingColumn] = useState(false);
  const [newColName, setNewColName] = useState("");
  const [newColColor, setNewColColor] = useState(COLUMN_COLORS[0]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  // Supabase Realtime
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

  function showColumnError(columnId: string, msg: string) {
    setColumnErrors((prev) => ({ ...prev, [columnId]: msg }));
    setTimeout(() => {
      setColumnErrors((prev) => {
        const next = { ...prev };
        delete next[columnId];
        return next;
      });
    }, 3000);
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const newStatus = over.id as string;
    setTasks((prev) => prev.map((t) => (t.id === active.id ? { ...t, status: newStatus } : t)));
    await fetch(`/api/tasks/${active.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
  }

  function handleRenameColumn(columnId: string, name: string) {
    setColumns((prev) => prev.map((c) => (c.id === columnId ? { ...c, name } : c)));
    fetch(`/api/projects/${projectId}/columns/${columnId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    }).catch(() => {});
  }

  function handleColorChange(columnId: string, color: string) {
    setColumns((prev) => prev.map((c) => (c.id === columnId ? { ...c, color } : c)));
    fetch(`/api/projects/${projectId}/columns/${columnId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ color }),
    }).catch(() => {});
  }

  function handleDeleteColumn(columnId: string) {
    const count = tasks.filter((t) => t.status === columnId).length;
    if (count > 0) {
      showColumnError(columnId, `Move ${count} task${count === 1 ? "" : "s"} out first`);
      return;
    }
    setColumns((prev) => prev.filter((c) => c.id !== columnId));
    fetch(`/api/projects/${projectId}/columns/${columnId}`, { method: "DELETE" }).catch(() => {});
  }

  async function handleAddColumn(name: string, color: string) {
    const res = await fetch(`/api/projects/${projectId}/columns`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, color }),
    });
    if (!res.ok) return;
    const col: Column = await res.json();
    setColumns((prev) => [...prev, col]);
  }

  function handleAddColumnSubmit(e: React.FormEvent) {
    e.preventDefault();
    const name = newColName.trim();
    if (!name) return;
    handleAddColumn(name, newColColor).catch(() => {});
    setAddingColumn(false);
    setNewColName("");
    setNewColColor(COLUMN_COLORS[0]);
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
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-8 pr-3 text-sm text-indigo-600 placeholder-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 dark:border-gray-700 dark:bg-gray-800 dark:text-indigo-400 dark:placeholder-gray-500"
          />
        </div>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | "")}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-indigo-600 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 dark:border-gray-700 dark:bg-gray-800 dark:text-indigo-400"
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
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-indigo-600 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 dark:border-gray-700 dark:bg-gray-800 dark:text-indigo-400"
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

      {/* Board */}
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-6 overflow-x-auto pb-4">
          {columns.map((col) => {
            const colTasks = filteredTasks.filter((t) => t.status === col.id);
            return (
              <div key={col.id} className="min-w-[280px] flex-shrink-0">
                <SortableContext
                  id={col.id}
                  items={colTasks.map((t) => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <KanbanColumn
                    column={col}
                    tasks={colTasks}
                    projectId={projectId}
                    projectKey={projectKey}
                    members={members}
                    workspaceLabels={workspaceLabels}
                    workspaceId={workspaceId}
                    columns={columns}
                    setTasks={setTasks}
                    onRename={(name) => handleRenameColumn(col.id, name)}
                    onDelete={() => handleDeleteColumn(col.id)}
                    onColorChange={(color) => handleColorChange(col.id, color)}
                    deleteError={columnErrors[col.id]}
                  />
                </SortableContext>
              </div>
            );
          })}

          {/* Add column */}
          <div className="min-w-[240px] flex-shrink-0">
            {addingColumn ? (
              <form
                onSubmit={handleAddColumnSubmit}
                className="rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/40 p-4 dark:border-indigo-800 dark:bg-indigo-950/30"
              >
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                  New column
                </p>
                <input
                  autoFocus
                  value={newColName}
                  onChange={(e) => setNewColName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") { setAddingColumn(false); setNewColName(""); }
                  }}
                  placeholder="Column name…"
                  className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm text-indigo-600 placeholder-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 dark:border-gray-700 dark:bg-gray-800 dark:text-indigo-400 dark:placeholder-gray-500"
                />
                <div className="mt-2 flex flex-wrap gap-1">
                  {COLUMN_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewColColor(c)}
                      className={`h-4 w-4 rounded-full transition-transform hover:scale-110 ${
                        newColColor === c ? "ring-2 ring-offset-1 ring-gray-400 dark:ring-gray-500" : ""
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <div className="mt-2 flex gap-1">
                  <button
                    type="submit"
                    disabled={!newColName.trim()}
                    className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAddingColumn(false); setNewColName(""); }}
                    className="rounded-lg px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setAddingColumn(true)}
                className="flex h-full min-h-[120px] w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-200 text-sm text-gray-400 hover:border-indigo-200 hover:text-indigo-500 dark:border-gray-700 dark:hover:border-indigo-700 dark:hover:text-indigo-400 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add column
              </button>
            )}
          </div>
        </div>

        <DragOverlay dropAnimation={{ duration: 150, easing: "ease" }}>
          {activeId ? (() => {
            const t = tasks.find((task) => task.id === activeId);
            if (!t) return null;
            return (
              <div className="rotate-1 cursor-grabbing rounded-xl border border-indigo-300 bg-white p-3 shadow-2xl dark:border-indigo-600 dark:bg-gray-800">
                <p className="text-sm font-medium leading-snug text-gray-800 dark:text-gray-100">{t.title}</p>
                {t.description && (
                  <p className="mt-1 line-clamp-2 text-xs text-gray-400 dark:text-gray-500">{t.description}</p>
                )}
                {t.labels && t.labels.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {t.labels.map((tl) => (
                      <span
                        key={tl.label.id}
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
                        style={{ backgroundColor: `${tl.label.color}22`, color: tl.label.color }}
                      >
                        {tl.label.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })() : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
