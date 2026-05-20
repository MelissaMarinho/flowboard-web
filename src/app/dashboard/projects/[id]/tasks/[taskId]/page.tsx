import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import TaskDetailClient from "@/components/TaskDetailClient";
import type { TaskWithAssignee } from "@/components/TaskEditModal";

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string; taskId: string }>;
}) {
  const { id: projectId, taskId } = await params;
  const session = await auth();
  const currentUserId = session?.user?.id ?? "";

  const task = await prisma.task.findUnique({
    where: { id: taskId, projectId },
    include: {
      assignee: { select: { id: true, name: true, image: true } },
      labels: { include: { label: { select: { id: true, name: true, color: true } } } },
      project: {
        include: {
          workspace: {
            include: {
              members: { include: { user: { select: { id: true, name: true, image: true } } } },
              labels: { orderBy: { name: "asc" } },
            },
          },
        },
      },
    },
  });

  if (!task) notFound();

  const activities = await prisma.activityLog.findMany({
    where: {
      projectId: task.projectId,
      meta: { path: ["taskId"], equals: taskId },
    },
    include: { user: { select: { id: true, name: true, image: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const members = task.project.workspace.members.map((m) => m.user);
  const workspaceLabels = task.project.workspace.labels;
  const workspaceId = task.project.workspaceId;

  // Serialize dates for client component
  const taskForClient = {
    ...task,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    dueDate: task.dueDate?.toISOString() ?? null,
  } as unknown as TaskWithAssignee;

  const activitiesForClient = activities.map((a) => ({
    ...a,
    createdAt: a.createdAt.toISOString(),
    meta: a.meta as Record<string, unknown>,
  }));

  return (
    <TaskDetailClient
      task={taskForClient}
      activities={activitiesForClient}
      members={members}
      workspaceLabels={workspaceLabels}
      workspaceId={workspaceId}
      projectId={projectId}
      currentUserId={currentUserId}
    />
  );
}
