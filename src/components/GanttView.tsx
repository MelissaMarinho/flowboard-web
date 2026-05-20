"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import TaskEditModal from "./TaskEditModal";
import type { TaskWithAssignee, Column, MemberUser, WorkspaceLabel } from "./TaskEditModal";

const DAY_PX = 36;
const LEFT_PX = 224;
const DAYS_IN_VIEW = 35;

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

function dayIndex(viewStart: Date, d: Date): number {
  return Math.round((startOfDay(d).getTime() - viewStart.getTime()) / 86400000);
}

export default function GanttView({
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
  const today = useMemo(() => startOfDay(new Date()), []);
  const [viewStart, setViewStart] = useState<Date>(() => addDays(today, -7));
  const [tasks, setTasks] = useState<TaskWithAssignee[]>(initialTasks);
  const [editingTask, setEditingTask] = useState<TaskWithAssignee | null>(null);

  const viewEnd = addDays(viewStart, DAYS_IN_VIEW);

  function prev() { setViewStart((d) => addDays(d, -7)); }
  function next() { setViewStart((d) => addDays(d, 7)); }
  function goToday() { setViewStart(addDays(today, -7)); }

  function getColumnColor(status: string): string {
    return columns.find((c) => c.id === status)?.color ?? "#94a3b8";
  }

  const viewDays = useMemo(
    () => Array.from({ length: DAYS_IN_VIEW }, (_, i) => addDays(viewStart, i)),
    [viewStart],
  );

  const monthGroups = useMemo(() => {
    const groups: { label: string; count: number }[] = [];
    for (const d of viewDays) {
      const label = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
      if (groups.length && groups[groups.length - 1].label === label) {
        groups[groups.length - 1].count++;
      } else {
        groups.push({ label, count: 1 });
      }
    }
    return groups;
  }, [viewDays]);

  const { datedTasks, undatedCount } = useMemo(() => {
    const dated = [...tasks]
      .filter((t) => t.dueDate)
      .sort(
        (a, b) =>
          new Date(a.dueDate as unknown as string).getTime() -
          new Date(b.dueDate as unknown as string).getTime(),
      );
    const undated = tasks.filter((t) => !t.dueDate);
    return { datedTasks: dated, undatedCount: undated.length };
  }, [tasks]);

  const todayIdx = dayIndex(viewStart, today);
  const todayVisible = todayIdx >= 0 && todayIdx < DAYS_IN_VIEW;

  const rangeLabel = `${MONTH_NAMES[viewStart.getMonth()].slice(0, 3)} ${viewStart.getDate()} – ${MONTH_NAMES[viewEnd.getMonth()].slice(0, 3)} ${viewEnd.getDate()}, ${viewEnd.getFullYear()}`;

  return (
    <div className="space-y-4">
      {/* Navigation */}
      <div className="flex items-center gap-3">
        <button
          onClick={prev}
          className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="min-w-[220px] text-center text-sm font-semibold text-gray-900 dark:text-gray-100">
          {rangeLabel}
        </span>
        <button
          onClick={next}
          className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <button
          onClick={goToday}
          className="rounded-lg border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
        >
          Today
        </button>
        <span className="text-xs text-gray-400 dark:text-gray-500">
          {datedTasks.length} task{datedTasks.length !== 1 ? "s" : ""} with due dates
        </span>
      </div>

      {/* Chart */}
      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <div style={{ minWidth: LEFT_PX + DAYS_IN_VIEW * DAY_PX }}>

          {/* Month header */}
          <div className="flex border-b border-gray-100 dark:border-gray-800">
            <div
              style={{ width: LEFT_PX, minWidth: LEFT_PX }}
              className="flex-shrink-0 border-r border-gray-100 px-3 py-2 dark:border-gray-800"
            >
              <span className="text-xs font-medium text-gray-400 dark:text-gray-500">Task</span>
            </div>
            <div className="flex">
              {monthGroups.map((g, i) => (
                <div
                  key={i}
                  style={{ width: g.count * DAY_PX }}
                  className="overflow-hidden border-r border-gray-100 px-2 py-2 text-xs font-semibold text-gray-500 dark:border-gray-800 dark:text-gray-400"
                >
                  {g.label}
                </div>
              ))}
            </div>
          </div>

          {/* Day numbers header */}
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <div
              style={{ width: LEFT_PX, minWidth: LEFT_PX }}
              className="flex-shrink-0 border-r border-gray-100 dark:border-gray-800"
            />
            <div className="flex">
              {viewDays.map((d, i) => {
                const isToday = todayIdx === i;
                const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                return (
                  <div
                    key={i}
                    style={{ width: DAY_PX }}
                    className={`flex items-center justify-center border-r border-gray-50 py-1.5 text-xs dark:border-gray-800/50 ${
                      isWeekend ? "bg-gray-50/60 dark:bg-gray-800/30" : ""
                    } ${isToday ? "bg-indigo-50 dark:bg-indigo-950/40" : ""}`}
                  >
                    <span
                      className={
                        isToday
                          ? "flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white"
                          : isWeekend
                          ? "text-gray-300 dark:text-gray-600"
                          : "text-gray-400 dark:text-gray-500"
                      }
                    >
                      {d.getDate()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Task rows */}
          <div className="relative">
            {/* Today vertical line */}
            {todayVisible && (
              <div
                className="pointer-events-none absolute bottom-0 top-0 z-10 w-px bg-indigo-400/50 dark:bg-indigo-500/40"
                style={{ left: LEFT_PX + todayIdx * DAY_PX + DAY_PX / 2 }}
              />
            )}

            {datedTasks.length === 0 ? (
              <div className="flex items-center justify-center py-16 text-sm text-gray-400 dark:text-gray-600">
                No tasks with due dates — assign a due date to see them here.
              </div>
            ) : (
              datedTasks.map((task) => {
                const color = getColumnColor(task.status);
                const t = task as unknown as TaskWithAssignee & {
                  number: number;
                };

                const rawCreated = task.createdAt as unknown as string;
                const rawDue = task.dueDate as unknown as string;

                const created = startOfDay(new Date(rawCreated));
                const due = startOfDay(new Date(rawDue));

                // Guard: if somehow due < created, swap so bar always has +ve width
                const barStart = created <= due ? created : due;
                const barEnd = created <= due ? due : created;

                const startIdx = dayIndex(viewStart, barStart);
                const endIdx = dayIndex(viewStart, barEnd) + 1; // inclusive → exclusive

                const clampedStart = Math.max(0, startIdx);
                const clampedEnd = Math.min(DAYS_IN_VIEW, endIdx);
                const barVisible = clampedEnd > clampedStart;

                const overflowLeft = startIdx < 0 && endIdx > 0;
                const overflowRight = endIdx > DAYS_IN_VIEW && startIdx < DAYS_IN_VIEW;
                const isOverdue = due < today;

                return (
                  <div
                    key={task.id}
                    className="flex items-center border-b border-gray-50 dark:border-gray-800/60"
                    style={{ height: 40 }}
                  >
                    {/* Left panel: task name */}
                    <div
                      style={{ width: LEFT_PX, minWidth: LEFT_PX }}
                      className="flex flex-shrink-0 items-center gap-2 overflow-hidden border-r border-gray-100 px-3 dark:border-gray-800"
                    >
                      <span
                        className="h-2 w-2 flex-shrink-0 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      <span className="truncate text-xs text-gray-700 dark:text-gray-300">
                        {projectKey && t.number > 0 && (
                          <span className="font-mono text-gray-400 dark:text-gray-500">
                            {projectKey}-{t.number}{" "}
                          </span>
                        )}
                        {task.title}
                      </span>
                    </div>

                    {/* Right panel: timeline bar */}
                    <div className="relative flex-1" style={{ height: 40 }}>
                      {/* Overflow arrow — bar extends left of view */}
                      {overflowLeft && (
                        <span
                          className="absolute left-0.5 top-1/2 -translate-y-1/2 text-[10px] leading-none"
                          style={{ color }}
                        >
                          ◀
                        </span>
                      )}

                      {/* Bar */}
                      {barVisible && (
                        <button
                          onClick={() => setEditingTask(task)}
                          className="absolute top-1/2 h-5 -translate-y-1/2 rounded transition-opacity hover:opacity-75"
                          style={{
                            left: clampedStart * DAY_PX + 2,
                            width: Math.max(
                              (clampedEnd - clampedStart) * DAY_PX - 4,
                              DAY_PX - 8,
                            ),
                            backgroundColor: `${color}28`,
                            border: `1.5px solid ${color}`,
                            boxShadow: isOverdue ? "0 0 0 1.5px #f87171" : undefined,
                          }}
                          title={`${task.title}${isOverdue ? " · overdue" : ""}`}
                        />
                      )}

                      {/* Overflow arrow — bar extends right of view */}
                      {overflowRight && (
                        <span
                          className="absolute right-0.5 top-1/2 -translate-y-1/2 text-[10px] leading-none"
                          style={{ color }}
                        >
                          ▶
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {/* Undated footer */}
            {undatedCount > 0 && (
              <div className="border-t border-dashed border-gray-100 px-4 py-2 dark:border-gray-800">
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {undatedCount} task{undatedCount !== 1 ? "s" : ""} with no due date are not shown
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

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
