import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import StatsCards from "@/components/StatsCards";
import TaskChart from "@/components/TaskChart";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const memberships = await prisma.workspaceMember.findMany({
    where: { userId: session.user.id },
    include: { workspace: { include: { projects: { include: { _count: { select: { tasks: true } } } } } } },
  });

  const workspaces = memberships.map((m) => m.workspace);
  const allProjects = workspaces.flatMap((w) => w.projects);

  const taskStats = await prisma.task.groupBy({
    by: ["status"],
    where: { project: { workspaceId: { in: workspaces.map((w) => w.id) } } },
    _count: true,
  });

  const stats = {
    workspaces: workspaces.length,
    projects: allProjects.length,
    todo: taskStats.find((s) => s.status === "TODO")?._count ?? 0,
    inProgress: taskStats.find((s) => s.status === "IN_PROGRESS")?._count ?? 0,
    done: taskStats.find((s) => s.status === "DONE")?._count ?? 0,
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {session.user.name?.split(" ")[0]}
        </h1>
        <p className="mt-1 text-sm text-gray-500">Here&apos;s what&apos;s happening across your workspaces</p>
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
    </div>
  );
}
