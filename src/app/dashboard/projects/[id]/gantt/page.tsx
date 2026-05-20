import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import GanttView from "@/components/GanttView";
import type { TaskWithAssignee } from "@/components/TaskEditModal";

export default async function GanttPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/signin");

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      workspace: {
        include: {
          members: {
            include: { user: { select: { id: true, name: true, image: true } } },
          },
        },
      },
      tasks: {
        include: {
          assignee: { select: { id: true, name: true, image: true } },
          labels: { include: { label: { select: { id: true, name: true, color: true } } } },
          subTasks: { select: { done: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      columns: { orderBy: { order: "asc" } },
    },
  });

  if (!project) notFound();

  const isMember = project.workspace.members.some((m) => m.userId === session.user!.id);
  if (!isMember) notFound();

  const members = project.workspace.members.map((m) => m.user);
  const workspaceLabels = await prisma.label.findMany({
    where: { workspaceId: project.workspace.id },
    orderBy: { name: "asc" },
  });

  const tasks: TaskWithAssignee[] = project.tasks.map((t) => ({
    ...t,
    dueDate: t.dueDate ? t.dueDate.toISOString() : null,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  })) as unknown as TaskWithAssignee[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{project.name}</h1>
        {project.description && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{project.description}</p>
        )}
      </div>

      <GanttView
        initialTasks={tasks}
        columns={project.columns}
        members={members}
        workspaceLabels={workspaceLabels}
        workspaceId={project.workspace.id}
        projectKey={project.key ?? undefined}
      />
    </div>
  );
}
