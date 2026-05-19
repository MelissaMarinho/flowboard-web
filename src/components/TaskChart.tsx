"use client";

import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from "recharts";
import { useTheme } from "next-themes";

interface DataPoint {
  name: string;
  value: number;
  fill: string;
}

export default function TaskChart({ data }: { data: DataPoint[] }) {
  const { theme } = useTheme();
  const dark = theme === "dark";

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
      <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Task Status</h2>
      <div className="mt-4 h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                borderRadius: "0.75rem",
                border: `1px solid ${dark ? "#374151" : "#e5e7eb"}`,
                background: dark ? "#111827" : "#fff",
                color: dark ? "#f3f4f6" : "#111827",
                fontSize: 12,
              }}
            />
            <Legend wrapperStyle={{ color: dark ? "#9ca3af" : undefined }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
