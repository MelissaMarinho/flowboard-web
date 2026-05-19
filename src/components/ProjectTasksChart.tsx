"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useTheme } from "next-themes";

export interface ProjectBarData {
  name: string;
  todo: number;
  inProgress: number;
  done: number;
}

export default function ProjectTasksChart({ data }: { data: ProjectBarData[] }) {
  const { theme } = useTheme();
  const dark = theme === "dark";

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
      <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-gray-100">Tasks by Project</h2>
      {data.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500">No projects yet.</p>
      ) : (
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={dark ? "#374151" : "#f0f0f0"} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: dark ? "#6b7280" : "#9ca3af" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: dark ? "#6b7280" : "#9ca3af" }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "0.75rem",
                  border: `1px solid ${dark ? "#374151" : "#e5e7eb"}`,
                  background: dark ? "#111827" : "#fff",
                  color: dark ? "#f3f4f6" : "#111827",
                  fontSize: 12,
                }}
              />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: dark ? "#9ca3af" : undefined }} />
              <Bar dataKey="todo" name="To Do" fill={dark ? "#312e81" : "#e0e7ff"} radius={[4, 4, 0, 0]} />
              <Bar dataKey="inProgress" name="In Progress" fill="#818cf8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="done" name="Done" fill="#4f46e5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
