import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  if (!projectId) return NextResponse.json({ error: "projectId required" }, { status: 400 });

  const tasks = await prisma.task.findMany({
    where: { projectId },
    include: { assignee: { select: { id: true, name: true, image: true } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(tasks);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, description, status, priority, projectId, assigneeId, dueDate } = await req.json();
  if (!title || !projectId) return NextResponse.json({ error: "title and projectId required" }, { status: 400 });

  const task = await prisma.task.create({
    data: {
      title,
      description,
      status: status ?? "TODO",
      priority: priority ?? "MEDIUM",
      projectId,
      assigneeId: assigneeId ?? null,
      dueDate: dueDate ? new Date(dueDate) : null,
    },
    include: { assignee: { select: { id: true, name: true, image: true } } },
  });

  // Log activity (non-blocking)
  prisma.activityLog
    .create({
      data: {
        projectId,
        userId: session.user.id,
        type: "TASK_CREATED",
        meta: { taskId: task.id, taskTitle: title },
      },
    })
    .catch(() => {});

  return NextResponse.json(task, { status: 201 });
}
