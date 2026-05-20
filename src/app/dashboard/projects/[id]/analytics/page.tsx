import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import AnalyticsView from "@/components/AnalyticsView";
import ProjectNav from "@/components/ProjectNav";
import type { TaskWithAssignee } from "@/components/TaskEditModal";

export default async function AnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const session = await auth();
  if (!session?.user?.id) notFound();

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      workspace: {
        include: { members: { select: { userId: true } } },
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

  const tasks: TaskWithAssignee[] = project.tasks.map((t) => ({
    ...t,
    dueDate: t.dueDate ? t.dueDate.toISOString() : null,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  })) as unknown as TaskWithAssignee[];

  return (
    <div className="space-y-0">
      <ProjectNav
        projectId={project.id}
        projectName={project.name}
        projectKey={project.key}
      />
      <AnalyticsView tasks={tasks} columns={project.columns} />
    </div>
  );
}
