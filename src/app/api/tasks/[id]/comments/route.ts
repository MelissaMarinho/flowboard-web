import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getTaskWorkspace(taskId: string) {
  return prisma.task.findUnique({
    where: { id: taskId },
    select: {
      title: true,
      assigneeId: true,
      projectId: true,
      project: { select: { workspaceId: true } },
    },
  });
}

async function checkMembership(workspaceId: string, userId: string) {
  return prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
  });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: taskId } = await params;

  const task = await getTaskWorkspace(taskId);
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const membership = await checkMembership(task.project.workspaceId, session.user!.id);
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const comments = await prisma.comment.findMany({
    where: { taskId },
    include: { user: { select: { id: true, name: true, image: true } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(comments);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: taskId } = await params;
  const { content } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: "Content required" }, { status: 400 });

  const task = await getTaskWorkspace(taskId);
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const membership = await checkMembership(task.project.workspaceId, session.user!.id);
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [comment] = await Promise.all([
    prisma.comment.create({
      data: { content: content.trim(), taskId, userId: session.user!.id },
      include: { user: { select: { id: true, name: true, image: true } } },
    }),
  ]);

  // Notify task assignee if they're not the one commenting
  if (task.assigneeId && task.assigneeId !== session.user!.id) {
    prisma.notification
      .create({
        data: {
          userId: task.assigneeId,
          type: "TASK_COMMENTED",
          title: "New comment on your task",
          body: `${comment.user.name ?? "Someone"}: ${content.trim().slice(0, 120)}`,
          link: `/dashboard/projects/${task.projectId}/tasks/${taskId}`,
        },
      })
      .catch(() => {});
  }

  return NextResponse.json(comment, { status: 201 });
}
