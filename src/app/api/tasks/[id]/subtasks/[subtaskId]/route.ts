import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function checkAccess(subtaskId: string, userId: string) {
  const sub = await prisma.subTask.findUnique({
    where: { id: subtaskId },
    select: {
      id: true,
      task: { select: { project: { select: { workspaceId: true } } } },
    },
  });
  if (!sub) return null;
  const member = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId: sub.task.project.workspaceId,
        userId,
      },
    },
  });
  return member ? sub : null;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; subtaskId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { subtaskId } = await params;
  const sub = await checkAccess(subtaskId, session.user!.id);
  if (!sub) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const updated = await prisma.subTask.update({
    where: { id: subtaskId },
    data: {
      ...(body.done !== undefined && { done: body.done }),
      ...(body.title !== undefined && { title: body.title }),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; subtaskId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { subtaskId } = await params;
  const sub = await checkAccess(subtaskId, session.user!.id);
  if (!sub) return new NextResponse(null, { status: 204 });

  await prisma.subTask.delete({ where: { id: subtaskId } });
  return new NextResponse(null, { status: 204 });
}
