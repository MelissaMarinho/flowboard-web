import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import StatsCards from "@/components/StatsCards";
import TaskChart from "@/components/TaskChart";
import ProjectTasksChart, { type ProjectBarData } from "@/components/ProjectTasksChart";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const memberships = await prisma.workspaceMember.findMany({
    where: { userId: session.user.id },
    include: {
      workspace: {
        include: {
          projects: { include: { _count: { select: { tasks: true } } } },
        },
      },
    },
  });

  const workspaces = memberships.map((m) => m.workspace);
  const allProjects = workspaces.flatMap((w) => w.projects);
  const workspaceIds = workspaces.map((w) => w.id);

  const [taskStats, perProjectStats] = await Promise.all([
    prisma.task.groupBy({
      by: ["status"],
      where: { project: { workspaceId: { in: workspaceIds } } },
      _count: true,
    }),
    prisma.task.groupBy({
      by: ["projectId", "status"],
      where: { project: { workspaceId: { in: workspaceIds } } },
      _count: true,
    }),
  ]);

  const stats = {
    workspaces: workspaces.length,
    projects: allProjects.length,
    todo: taskStats.find((s) => s.status === "TODO")?._count ?? 0,
    inProgress: taskStats.find((s) => s.status === "IN_PROGRESS")?._count ?? 0,
    done: taskStats.find((s) => s.status === "DONE")?._count ?? 0,
  };

  // Build per-project bar chart data (top 6 by task count)
  const projectIdToName = Object.fromEntries(allProjects.map((p) => [p.id, p.name]));
  const barDataMap: Record<string, ProjectBarData> = {};
  for (const row of perProjectStats) {
    if (!barDataMap[row.projectId]) {
      const rawName = projectIdToName[row.projectId] ?? "Unknown";
      barDataMap[row.projectId] = {
        name: rawName.length > 14 ? rawName.slice(0, 12) + "…" : rawName,
        todo: 0,
        inProgress: 0,
        done: 0,
      };
    }
    if (row.status === "TODO") barDataMap[row.projectId].todo = row._count;
    if (row.status === "IN_PROGRESS") barDataMap[row.projectId].inProgress = row._count;
    if (row.status === "DONE") barDataMap[row.projectId].done = row._count;
  }
  const barData = Object.values(barDataMap)
    .sort((a, b) => b.todo + b.inProgress + b.done - (a.todo + a.inProgress + a.done))
    .slice(0, 6);

  if (workspaces.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center py-24 text-center">
        <div className="rounded-2xl border border-dashed border-gray-300 px-12 py-16 max-w-md">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50">
            <svg className="h-7 w-7 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Create your first workspace</h2>
          <p className="mt-2 text-sm text-gray-500">
            Workspaces let you organise projects and invite your team. Get started by creating one.
          </p>
          <Link
            href="/dashboard/projects"
            className="mt-6 inline-flex items-center rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
          >
            Get started
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {session.user.name?.split(" ")[0]}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Here&apos;s what&apos;s happening across your workspaces
        </p>
      </div>

      <StatsCards stats={stats} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TaskChart
          data={[
            { name: "To Do", value: stats.todo, fill: "#e0e7ff" },
            { name: "In Progress", value: stats.inProgress, fill: "#818cf8" },
            { name: "Done", value: stats.done, fill: "#4f46e5" },
          ]}
        />
        <ProjectTasksChart data={barData} />
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="text-base font-semibold text-gray-900">Recent Projects</h2>
        <ul className="mt-4 space-y-3">
          {allProjects.slice(0, 5).map((p) => (
            <li key={p.id} className="flex items-center justify-between">
              <span className="text-sm text-gray-700">{p.name}</span>
              <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                {p._count.tasks} tasks
              </span>
            </li>
          ))}
          {allProjects.length === 0 && (
            <li className="text-sm text-gray-400">No projects yet</li>
          )}
        </ul>
      </div>
    </div>
  );
}
