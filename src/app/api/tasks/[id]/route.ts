import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  // Fetch current task to detect what changed
  const current = await prisma.task.findUnique({ where: { id } });
  if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Reconcile labels if provided
  if (Array.isArray(body.labelIds)) {
    await prisma.taskLabel.deleteMany({ where: { taskId: id } });
    if (body.labelIds.length > 0) {
      await prisma.taskLabel.createMany({
        data: body.labelIds.map((labelId: string) => ({ taskId: id, labelId })),
      });
    }
  }

  const task = await prisma.task.update({
    where: { id },
    data: {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.priority !== undefined && { priority: body.priority }),
      ...(body.assigneeId !== undefined && { assigneeId: body.assigneeId }),
      ...(body.dueDate !== undefined && { dueDate: body.dueDate ? new Date(body.dueDate) : null }),
      ...(body.sprintId !== undefined && { sprintId: body.sprintId }),
    },
    include: {
      assignee: { select: { id: true, name: true, image: true } },
      labels: { include: { label: { select: { id: true, name: true, color: true } } } },
      subTasks: { select: { done: true } },
    },
  });

  // Build change summary
  const changes: string[] = [];
  if (body.status && body.status !== current.status) changes.push(`status → ${body.status}`);
  if (body.priority && body.priority !== current.priority) changes.push(`priority → ${body.priority}`);
  if (body.title && body.title !== current.title) changes.push("title updated");
  if (body.assigneeId !== undefined && body.assigneeId !== current.assigneeId) {
    changes.push(body.assigneeId ? "assigned" : "unassigned");
  }
  if (body.dueDate !== undefined && body.dueDate !== current.dueDate?.toISOString().split("T")[0]) {
    changes.push(body.dueDate ? `due → ${body.dueDate}` : "due date cleared");
  }

  if (changes.length > 0) {
    prisma.activityLog
      .create({
        data: {
          projectId: current.projectId,
          userId: session.user!.id,
          type: "TASK_UPDATED",
          meta: { taskId: id, taskTitle: task.title, changes },
        },
      })
      .catch(() => {});
  }

  // Notify new assignee (if changed and not assigning to yourself)
  if (
    body.assigneeId &&
    body.assigneeId !== current.assigneeId &&
    body.assigneeId !== session.user!.id
  ) {
    prisma.notification
      .create({
        data: {
          userId: body.assigneeId,
          type: "TASK_ASSIGNED",
          title: "You were assigned a task",
          body: task.title,
          link: `/dashboard/projects/${current.projectId}/tasks/${id}`,
        },
      })
      .catch(() => {});
  }

  return NextResponse.json(task);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Fetch task before deleting so we can log it
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) return new NextResponse(null, { status: 204 });

  await prisma.task.delete({ where: { id } });

  prisma.activityLog
    .create({
      data: {
        projectId: task.projectId,
        userId: session.user!.id,
        type: "TASK_DELETED",
        meta: { taskTitle: task.title },
      },
    })
    .catch(() => {});

  return new NextResponse(null, { status: 204 });
}
