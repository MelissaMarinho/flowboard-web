"use client";

import { useState, useRef, useEffect } from "react";
import { X, Tag, Plus, Check } from "lucide-react";
import type { Task } from "@prisma/client";
import LabelBadge from "./LabelBadge";

export interface WorkspaceLabel {
  id: string;
  name: string;
  color: string;
}

export type TaskLabel = { label: WorkspaceLabel };

type TaskWithAssignee = Task & {
  assignee: { id: string; name: string | null; image: string | null } | null;
  labels?: TaskLabel[];
  subTasks?: { done: boolean }[];
};

export type { TaskWithAssignee };

export interface MemberUser {
  id: string;
  name: string | null;
  image: string | null;
}

export interface Column {
  id: string;
  name: string;
  color: string;
  order: number;
  projectId: string;
}

export interface Sprint {
  id: string;
  name: string;
  goal: string | null;
  startDate: string | null;
  endDate: string | null;
  status: "PLANNING" | "ACTIVE" | "COMPLETED";
  projectId: string;
  createdAt: string;
}

const PRIORITIES = ["LOW", "MEDIUM", "HIGH"] as const;

const PRESET_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444",
  "#f97316", "#f59e0b", "#22c55e", "#14b8a6",
  "#0ea5e9", "#6b7280",
];

export default function TaskEditModal({
  task,
  members = [],
  workspaceLabels = [],
  workspaceId,
  columns = [],
  onClose,
  onSave,
}: {
  task: TaskWithAssignee;
  members?: MemberUser[];
  workspaceLabels?: WorkspaceLabel[];
  workspaceId?: string;
  columns?: Column[];
  onClose: () => void;
  onSave: (updated: TaskWithAssignee) => void;
}) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [priority, setPriority] = useState(task.priority);
  const [status, setStatus] = useState<string>(task.status);
  const [assigneeId, setAssigneeId] = useState(task.assigneeId ?? "");
  const [dueDate, setDueDate] = useState(
    task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : ""
  );
  const [sprintId, setSprintId] = useState((task as unknown as { sprintId: string | null }).sprintId ?? "");
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>(
    (task.labels ?? []).map((tl) => tl.label.id)
  );
  const [availableLabels, setAvailableLabels] = useState<WorkspaceLabel[]>(workspaceLabels);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [sprints, setSprints] = useState<Sprint[]>([]);

  useEffect(() => {
    async function loadSprints() {
      try {
        const res = await fetch(`/api/projects/${task.projectId}/sprints`);
        if (res.ok) {
          const data: unknown = await res.json();
          if (Array.isArray(data)) setSprints(data as Sprint[]);
        }
      } catch {
        // silently ignore
      }
    }
    loadSprints();
  }, [task.projectId]);

  // Label picker state
  const [pickerOpen, setPickerOpen] = useState(false);
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState(PRESET_COLORS[0]);
  const [creatingLabel, setCreatingLabel] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Close picker on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function toggleLabel(id: string) {
    setSelectedLabelIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function createLabel() {
    if (!newLabelName.trim() || !workspaceId) return;
    setCreatingLabel(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/labels`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newLabelName.trim(), color: newLabelColor }),
      });
      if (!res.ok) throw new Error("Failed to create label");
      const created: WorkspaceLabel = await res.json();
      setAvailableLabels((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setSelectedLabelIds((prev) => [...prev, created.id]);
      setNewLabelName("");
    } catch {
      // silently ignore
    } finally {
      setCreatingLabel(false);
    }
  }

  async function handleSave() {
    if (!title.trim()) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          priority,
          status,
          assigneeId: assigneeId || null,
          dueDate: dueDate || null,
          labelIds: selectedLabelIds,
          sprintId: sprintId || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      const updated: TaskWithAssignee = await res.json();
      onSave(updated);
      onClose();
    } catch {
      setError("Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const selectedLabels = availableLabels.filter((l) => selectedLabelIds.includes(l.id));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Edit Task</h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Title</label>
            <input
              id="edit-title"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-indigo-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-indigo-400"
            />
          </div>

          <div>
            <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Description</label>
            <textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Add a description…"
              className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm text-indigo-600 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-indigo-400 dark:placeholder-gray-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="edit-priority" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Priority</label>
              <select
                id="edit-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as Task["priority"])}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-indigo-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-indigo-400"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{p.charAt(0) + p.slice(1).toLowerCase()}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="edit-status" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Status</label>
              <select
                id="edit-status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-indigo-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-indigo-400"
              >
                {(columns ?? []).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {members.length > 0 && (
            <div>
              <label htmlFor="edit-assignee" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Assignee</label>
              <select
                id="edit-assignee"
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-indigo-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-indigo-400"
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>{m.name ?? m.id}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label htmlFor="edit-duedate" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Due Date</label>
            <input
              id="edit-duedate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-indigo-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-indigo-400"
            />
          </div>

          {sprints.filter((s) => s.status !== "COMPLETED").length > 0 && (
            <div>
              <label htmlFor="edit-sprint" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
                Sprint
              </label>
              <select
                id="edit-sprint"
                value={sprintId}
                onChange={(e) => setSprintId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-indigo-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-indigo-400"
              >
                <option value="">Backlog (no sprint)</option>
                {sprints
                  .filter((s) => s.status !== "COMPLETED")
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}{s.status === "ACTIVE" ? " 🟢" : ""}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Labels */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">Labels</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {selectedLabels.map((l) => (
                <LabelBadge
                  key={l.id}
                  name={l.name}
                  color={l.color}
                  onRemove={() => toggleLabel(l.id)}
                />
              ))}
            </div>

            {/* Picker */}
            <div className="relative" ref={pickerRef}>
              <button
                type="button"
                onClick={() => setPickerOpen((o) => !o)}
                className="flex items-center gap-1.5 rounded-lg border border-dashed border-gray-300 px-3 py-1.5 text-xs text-gray-500 hover:border-indigo-300 hover:text-indigo-600 dark:border-gray-600 dark:text-gray-400 dark:hover:border-indigo-700 dark:hover:text-indigo-400 transition-colors"
              >
                <Tag className="h-3 w-3" />
                Add label
              </button>

              {pickerOpen && (
                <div className="absolute left-0 top-full z-10 mt-1 w-56 rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
                  {/* Existing labels */}
                  {availableLabels.length > 0 && (
                    <ul className="max-h-40 overflow-y-auto p-1">
                      {availableLabels.map((l) => (
                        <li key={l.id}>
                          <button
                            type="button"
                            onClick={() => toggleLabel(l.id)}
                            className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: l.color }} />
                            <span className="flex-1 truncate text-left text-gray-700 dark:text-gray-300">{l.name}</span>
                            {selectedLabelIds.includes(l.id) && (
                              <Check className="h-3.5 w-3.5 flex-shrink-0 text-indigo-500" />
                            )}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Create new label */}
                  {workspaceId && (
                    <div className="border-t border-gray-100 p-2 dark:border-gray-700">
                      <p className="mb-1.5 text-xs font-medium text-gray-400 dark:text-gray-500">New label</p>
                      <input
                        type="text"
                        value={newLabelName}
                        onChange={(e) => setNewLabelName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); createLabel(); } }}
                        placeholder="Label name…"
                        className="w-full rounded-lg border border-gray-200 px-2 py-1 text-xs text-indigo-600 placeholder-gray-400 focus:border-indigo-400 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-indigo-400 dark:placeholder-gray-500"
                      />
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {PRESET_COLORS.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setNewLabelColor(c)}
                            className="h-4 w-4 rounded-full transition-transform hover:scale-110"
                            style={{ backgroundColor: c, outline: newLabelColor === c ? `2px solid ${c}` : "none", outlineOffset: "2px" }}
                          />
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={createLabel}
                        disabled={!newLabelName.trim() || creatingLabel}
                        className="mt-1.5 flex w-full items-center justify-center gap-1 rounded-lg bg-indigo-600 px-2 py-1 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                        {creatingLabel ? "Creating…" : "Create"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !title.trim()}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
