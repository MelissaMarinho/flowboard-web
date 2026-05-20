import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getProjectAccess(projectId: string, userId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { workspaceId: true },
  });
  if (!project) return null;
  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId: project.workspaceId, userId } },
  });
  return member ? project : null;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;
  const project = await getProjectAccess(projectId, session.user!.id);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const columns = await prisma.column.findMany({
    where: { projectId },
    orderBy: { order: "asc" },
  });
  return NextResponse.json(columns);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;
  const project = await getProjectAccess(projectId, session.user!.id);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { name, color } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const last = await prisma.column.findFirst({
    where: { projectId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  const column = await prisma.column.create({
    data: {
      name: name.trim(),
      color: color ?? "#94a3b8",
      order: (last?.order ?? -1) + 1,
      projectId,
    },
  });
  return NextResponse.json(column, { status: 201 });
}
