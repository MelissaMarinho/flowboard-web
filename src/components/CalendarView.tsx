"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import TaskEditModal from "./TaskEditModal";
import type { TaskWithAssignee, Column, MemberUser, WorkspaceLabel } from "./TaskEditModal";

const DAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const PRIORITY_DOT: Record<string, string> = {
  HIGH: "bg-red-400",
  MEDIUM: "bg-amber-400",
  LOW: "bg-gray-300",
};

function buildCalendarDays(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days: (Date | null)[] = [];
  for (let i = 0; i < firstDay.getDay(); i++) days.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d));
  while (days.length % 7 !== 0) days.push(null);
  return days;
}

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function dueDateKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function CalendarView({
  initialTasks,
  columns,
  members = [],
  workspaceLabels = [],
  workspaceId,
  projectKey,
}: {
  initialTasks: TaskWithAssignee[];
  columns: Column[];
  members?: MemberUser[];
  workspaceLabels?: WorkspaceLabel[];
  workspaceId?: string;
  projectKey?: string;
}) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [tasks, setTasks] = useState<TaskWithAssignee[]>(initialTasks);
  const [editingTask, setEditingTask] = useState<TaskWithAssignee | null>(null);
  const [showUndated, setShowUndated] = useState(false);

  function prevMonth() {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
  }

  function nextMonth() {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
  }

  function getColumnColor(status: string) {
    return columns.find((c) => c.id === status)?.color ?? "#94a3b8";
  }

  // Build task map keyed by "YYYY-MM-DD"
  const tasksByDate = new Map<string, TaskWithAssignee[]>();
  for (const task of tasks) {
    if (!task.dueDate) continue;
    const key = dueDateKey(task.dueDate as unknown as string);
    if (!tasksByDate.has(key)) tasksByDate.set(key, []);
    tasksByDate.get(key)!.push(task);
  }

  const undatedTasks = tasks.filter((t) => !t.dueDate);
  const calendarDays = buildCalendarDays(year, month);
  const todayKey = dateKey(today);

  return (
    <div className="space-y-4">
      {/* Month navigation */}
      <div className="flex items-center gap-3">
        <button
          onClick={prevMonth}
          className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <h2 className="min-w-[160px] text-center text-sm font-semibold text-gray-900 dark:text-gray-100">
          {MONTH_NAMES[month]} {year}
        </h2>
        <button
          onClick={nextMonth}
          className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <button
          onClick={() => { setYear(today.getFullYear()); setMonth(today.getMonth()); }}
          className="rounded-lg border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
        >
          Today
        </button>
      </div>

      {/* Calendar grid */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 border-b border-gray-100 dark:border-gray-800">
          {DAY_HEADERS.map((d) => (
            <div
              key={d}
              className="py-2 text-center text-xs font-medium text-gray-400 dark:text-gray-500"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {calendarDays.map((date, i) => {
            if (!date) {
              return (
                <div
                  key={`pad-${i}`}
                  className="min-h-[100px] border-b border-r border-gray-50 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-900/50"
                />
              );
            }

            const key = dateKey(date);
            const dayTasks = tasksByDate.get(key) ?? [];
            const isToday = key === todayKey;
            const isPast = date < today && key !== todayKey;
            const isLastRow = i >= calendarDays.length - 7;
            const isLastCol = (i + 1) % 7 === 0;

            return (
              <div
                key={key}
                className={`min-h-[100px] p-1.5 ${isLastRow ? "" : "border-b"} ${isLastCol ? "" : "border-r"} border-gray-100 dark:border-gray-800 ${
                  isToday
                    ? "bg-indigo-50/60 dark:bg-indigo-950/30"
                    : isPast
                    ? "bg-gray-50/30 dark:bg-gray-900"
                    : "bg-white dark:bg-gray-900"
                }`}
              >
                {/* Date number */}
                <div className="mb-1 flex justify-end">
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full text-xs ${
                      isToday
                        ? "bg-indigo-600 font-bold text-white"
                        : isPast
                        ? "text-gray-300 dark:text-gray-600"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {date.getDate()}
                  </span>
                </div>

                {/* Task chips */}
                <div className="space-y-0.5">
                  {dayTasks.slice(0, 3).map((task) => {
                    const color = getColumnColor(task.status);
                    const t = task as unknown as TaskWithAssignee & { priority: string; number: number };
                    return (
                      <button
                        key={task.id}
                        onClick={() => setEditingTask(task)}
                        className="flex w-full items-center gap-1 rounded px-1 py-0.5 text-left hover:opacity-80 transition-opacity"
                        style={{ backgroundColor: `${color}18`, borderLeft: `2px solid ${color}` }}
                        title={task.title}
                      >
                        <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${PRIORITY_DOT[t.priority] ?? "bg-gray-300"}`} />
                        <span className="truncate text-xs text-gray-700 dark:text-gray-200">
                          {projectKey && t.number > 0 ? `${projectKey}-${t.number} ` : ""}
                          {task.title}
                        </span>
                      </button>
                    );
                  })}
                  {dayTasks.length > 3 && (
                    <p className="pl-1 text-xs text-gray-400 dark:text-gray-500">
                      +{dayTasks.length - 3} more
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* No due date section */}
      {undatedTasks.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          <button
            onClick={() => setShowUndated((o) => !o)}
            className="flex w-full items-center justify-between px-4 py-3 text-left"
          >
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
              No due date
              <span className="ml-2 font-normal">({undatedTasks.length})</span>
            </span>
            <ChevronRight
              className={`h-3.5 w-3.5 text-gray-400 transition-transform ${showUndated ? "rotate-90" : ""}`}
            />
          </button>
          {showUndated && (
            <div className="border-t border-gray-100 dark:border-gray-800">
              {undatedTasks.map((task, i) => {
                const color = getColumnColor(task.status);
                const t = task as unknown as TaskWithAssignee & { number: number };
                return (
                  <button
                    key={task.id}
                    onClick={() => setEditingTask(task)}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                      i !== undatedTasks.length - 1 ? "border-b border-gray-50 dark:border-gray-800" : ""
                    }`}
                  >
                    <span
                      className="h-2 w-2 flex-shrink-0 rounded-full"
                      style={{ backgroundColor: color }}
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
                      style={{ backgroundColor: color }}
                    >
                      {columns.find((c) => c.id === task.status)?.name ?? task.status}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Edit modal */}
      {editingTask && (
        <TaskEditModal
          task={editingTask}
          members={members}
          workspaceLabels={workspaceLabels}
          workspaceId={workspaceId}
          columns={columns}
          onClose={() => setEditingTask(null)}
          onSave={(updated) => {
            setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
            setEditingTask(null);
          }}
        />
      )}
    </div>
  );
}
