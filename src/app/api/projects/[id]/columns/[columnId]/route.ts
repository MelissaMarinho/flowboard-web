import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getColumnAccess(columnId: string, userId: string) {
  const col = await prisma.column.findUnique({
    where: { id: columnId },
    select: { id: true, projectId: true, project: { select: { workspaceId: true } } },
  });
  if (!col) return null;
  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId: col.project.workspaceId, userId } },
  });
  return member ? col : null;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; columnId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { columnId } = await params;
  const col = await getColumnAccess(columnId, session.user!.id);
  if (!col) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const updated = await prisma.column.update({
    where: { id: columnId },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.color !== undefined && { color: body.color }),
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; columnId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { columnId } = await params;
  const col = await getColumnAccess(columnId, session.user!.id);
  if (!col) return new NextResponse(null, { status: 204 });

  const taskCount = await prisma.task.count({ where: { status: columnId } });
  if (taskCount > 0) {
    return NextResponse.json(
      { error: `Cannot delete: ${taskCount} task${taskCount === 1 ? "" : "s"} in this column` },
      { status: 409 }
    );
  }

  await prisma.column.delete({ where: { id: columnId } });
  return new NextResponse(null, { status: 204 });
}
