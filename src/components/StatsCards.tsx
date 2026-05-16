import { Briefcase, FolderOpen, CheckCircle2, Clock, CircleDot } from "lucide-react";

interface Stats {
  workspaces: number;
  projects: number;
  todo: number;
  inProgress: number;
  done: number;
}

const cards = (s: Stats) => [
  { label: "Workspaces", value: s.workspaces, icon: Briefcase, color: "text-indigo-600 bg-indigo-50" },
  { label: "Projects", value: s.projects, icon: FolderOpen, color: "text-violet-600 bg-violet-50" },
  { label: "To Do", value: s.todo, icon: CircleDot, color: "text-gray-600 bg-gray-100" },
  { label: "In Progress", value: s.inProgress, icon: Clock, color: "text-amber-600 bg-amber-50" },
  { label: "Done", value: s.done, icon: CheckCircle2, color: "text-green-600 bg-green-50" },
];

export default function StatsCards({ stats }: { stats: Stats }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {cards(stats).map(({ label, value, icon: Icon, color }) => (
        <div key={label} className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className={`inline-flex rounded-lg p-2 ${color}`}>
            <Icon className="h-4 w-4" />
          </div>
          <p className="mt-3 text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-xs text-gray-500">{label}</p>
        </div>
      ))}
    </div>
  );
}
