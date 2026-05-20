import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import MyTasksView from "@/components/MyTasksView";
import type { TaskWithAssignee, Column } from "@/components/TaskEditModal";

export default async function MyTasksPage() {
  const session = await auth();
  if (!session?.user?.id) notFound();

  const rawTasks = await prisma.task.findMany({
    where: { assigneeId: session.user.id },
    include: {
      project: { select: { id: true, name: true, key: true } },
      assignee: { select: { id: true, name: true, image: true } },
      labels: { include: { label: { select: { id: true, name: true, color: true } } } },
      subTasks: { select: { done: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  // Serialize dates
  const tasks = rawTasks.map((t) => ({
    ...t,
    dueDate: t.dueDate ? t.dueDate.toISOString() : null,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  })) as unknown as (TaskWithAssignee & {
    project: { id: string; name: string; key: string | null };
  })[];

  // Fetch columns for all projects that have these tasks
  const projectIds = [...new Set(rawTasks.map((t) => t.projectId))];
  const allColumns =
    projectIds.length > 0
      ? await prisma.column.findMany({
          where: { projectId: { in: projectIds } },
          orderBy: { order: "asc" },
        })
      : [];

  const columnsByProject = allColumns.reduce<Record<string, Column[]>>((acc, col) => {
    if (!acc[col.projectId]) acc[col.projectId] = [];
    acc[col.projectId].push(col as Column);
    return acc;
  }, {});

  const workspaceIds = [
    ...new Set(
      (
        await prisma.workspaceMember.findMany({
          where: { userId: session.user.id },
          select: { workspaceId: true },
        })
      ).map((m) => m.workspaceId),
    ),
  ];

  const workspaceLabels =
    workspaceIds.length > 0
      ? await prisma.label.findMany({
          where: { workspaceId: { in: workspaceIds } },
          orderBy: { name: "asc" },
        })
      : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My Tasks</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          All tasks assigned to you across every project
        </p>
      </div>

      <MyTasksView
        initialTasks={tasks}
        columnsByProject={columnsByProject}
        workspaceLabels={workspaceLabels}
      />
    </div>
  );
}
