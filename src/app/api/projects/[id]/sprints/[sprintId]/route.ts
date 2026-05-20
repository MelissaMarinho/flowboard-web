import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getSprintAccess(sprintId: string, userId: string) {
  const sprint = await prisma.sprint.findUnique({
    where: { id: sprintId },
    select: { id: true, projectId: true, status: true, project: { select: { workspaceId: true } } },
  });
  if (!sprint) return null;
  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId: sprint.project.workspaceId, userId } },
  });
  return member ? sprint : null;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; sprintId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sprintId } = await params;
  const sprint = await getSprintAccess(sprintId, session.user!.id);
  if (!sprint) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();

  // Guard: only one active sprint per project
  if (body.status === "ACTIVE") {
    const alreadyActive = await prisma.sprint.findFirst({
      where: { projectId: sprint.projectId, status: "ACTIVE", id: { not: sprintId } },
    });
    if (alreadyActive) {
      return NextResponse.json(
        { error: "Another sprint is already active. Complete it first." },
        { status: 409 }
      );
    }
  }

  const updated = await prisma.sprint.update({
    where: { id: sprintId },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.goal !== undefined && { goal: body.goal }),
      ...(body.startDate !== undefined && { startDate: body.startDate ? new Date(body.startDate) : null }),
      ...(body.endDate !== undefined && { endDate: body.endDate ? new Date(body.endDate) : null }),
      ...(body.status !== undefined && { status: body.status }),
    },
    include: { _count: { select: { tasks: true } } },
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; sprintId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sprintId } = await params;
  const sprint = await getSprintAccess(sprintId, session.user!.id);
  if (!sprint) return new NextResponse(null, { status: 204 });

  await prisma.sprint.delete({ where: { id: sprintId } });
  return new NextResponse(null, { status: 204 });
}
