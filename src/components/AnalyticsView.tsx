"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";
import type { TaskWithAssignee, Column } from "./TaskEditModal";

const PRIORITY_COLORS: Record<string, string> = {
  HIGH: "#ef4444",
  MEDIUM: "#f59e0b",
  LOW: "#94a3b8",
};

interface TooltipProps {
  active?: boolean;
  payload?: { value: number; name?: string; payload?: { name: string } }[];
}

function ChartTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const label = payload[0].name ?? payload[0].payload?.name ?? "";
  const val = payload[0].value;
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-gray-700 dark:bg-gray-800">
      <p className="font-medium text-gray-800 dark:text-gray-200">{label}</p>
      <p className="text-gray-500 dark:text-gray-400">
        {val} task{val !== 1 ? "s" : ""}
      </p>
    </div>
  );
}

export default function AnalyticsView({
  tasks,
  columns,
}: {
  tasks: TaskWithAssignee[];
  columns: Column[];
}) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const stats = useMemo(() => {
    const total = tasks.length;
    const lastCol = columns[columns.length - 1];
    const completed = lastCol ? tasks.filter((t) => t.status === lastCol.id).length : 0;
    const overdue = tasks.filter(
      (t) => t.dueDate && new Date(t.dueDate as unknown as string) < today,
    ).length;
    const unassigned = tasks.filter((t) => !t.assigneeId).length;
    const noDueDate = tasks.filter((t) => !t.dueDate).length;
    const completionRate =
      total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, overdue, unassigned, noDueDate, completionRate };
  }, [tasks, columns, today]);

  const byStatus = useMemo(
    () =>
      columns
        .map((c) => ({
          name: c.name,
          count: tasks.filter((t) => t.status === c.id).length,
          color: c.color,
        }))
        .filter((c) => c.count > 0),
    [tasks, columns],
  );

  const byPriority = useMemo(() => {
    const counts: Record<string, number> = { HIGH: 0, MEDIUM: 0, LOW: 0 };
    for (const t of tasks) {
      const p = (t as unknown as { priority: string }).priority;
      if (p in counts) counts[p]++;
    }
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({
        name,
        value,
        color: PRIORITY_COLORS[name] ?? "#94a3b8",
      }));
  }, [tasks]);

  const statCards = [
    {
      label: "Total tasks",
      value: stats.total,
      sub: null,
      color: "text-gray-900 dark:text-gray-100",
    },
    {
      label: "Completed",
      value: stats.completed,
      sub: `${stats.completionRate}% completion rate`,
      color: "text-green-600 dark:text-green-400",
    },
    {
      label: "Overdue",
      value: stats.overdue,
      sub: null,
      color:
        stats.overdue > 0
          ? "text-red-600 dark:text-red-400"
          : "text-gray-900 dark:text-gray-100",
    },
    {
      label: "Unassigned",
      value: stats.unassigned,
      sub: null,
      color: "text-gray-900 dark:text-gray-100",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {statCards.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900"
          >
            <p className="text-xs text-gray-400 dark:text-gray-500">{s.label}</p>
            <p className={`mt-1 text-3xl font-bold ${s.color}`}>{s.value}</p>
            {s.sub && (
              <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{s.sub}</p>
            )}
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Tasks by status */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <h3 className="mb-5 text-sm font-semibold text-gray-700 dark:text-gray-300">
            Tasks by status
          </h3>
          {byStatus.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-sm text-gray-400 dark:text-gray-600">
              No tasks yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byStatus} barSize={36} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(99,102,241,0.06)" }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {byStatus.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Tasks by priority */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <h3 className="mb-5 text-sm font-semibold text-gray-700 dark:text-gray-300">
            Tasks by priority
          </h3>
          {byPriority.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-sm text-gray-400 dark:text-gray-600">
              No tasks yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={byPriority}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                >
                  {byPriority.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => (
                    <span style={{ fontSize: 11, color: "#9ca3af" }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* No due date notice */}
      {stats.noDueDate > 0 && (
        <p className="text-xs text-gray-400 dark:text-gray-500">
          {stats.noDueDate} task{stats.noDueDate !== 1 ? "s" : ""} have no due date set.
        </p>
      )}
    </div>
  );
}
