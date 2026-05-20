import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import SprintsView from "@/components/SprintsView";
import type { TaskWithAssignee, Column, Sprint } from "@/components/TaskEditModal";

type SprintWithCount = Sprint & { _count: { tasks: number } };

export default async function SprintsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = await params;
  const session = await auth();
  if (!session?.user?.id) notFound();

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      columns: { orderBy: { order: "asc" } },
      workspace: {
        include: {
          members: { select: { userId: true } },
        },
      },
    },
  });

  if (!project) notFound();

  const isMember = project.workspace.members.some((m) => m.userId === session.user!.id);
  if (!isMember) notFound();

  const [sprints, tasks] = await Promise.all([
    prisma.sprint.findMany({
      where: { projectId },
      include: { _count: { select: { tasks: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.task.findMany({
      where: { projectId },
      include: {
        assignee: { select: { id: true, name: true, image: true } },
        labels: { include: { label: { select: { id: true, name: true, color: true } } } },
        subTasks: { select: { done: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  // Serialize dates for client components
  const sprintsForClient = sprints.map((s) => ({
    ...s,
    startDate: s.startDate?.toISOString() ?? null,
    endDate: s.endDate?.toISOString() ?? null,
    createdAt: s.createdAt.toISOString(),
    status: s.status as Sprint["status"],
  })) as SprintWithCount[];

  const tasksForClient = tasks.map((t) => ({
    ...t,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    dueDate: t.dueDate?.toISOString() ?? null,
  })) as unknown as TaskWithAssignee[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{project.name}</h1>
        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">Sprint planning</p>
      </div>
      <SprintsView
        projectId={projectId}
        projectKey={project.key ?? undefined}
        initialSprints={sprintsForClient}
        initialTasks={tasksForClient}
        columns={project.columns as Column[]}
      />
    </div>
  );
}
