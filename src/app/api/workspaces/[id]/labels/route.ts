import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/workspaces/[id]/labels — list all labels for a workspace
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId: id, userId: session.user.id } },
  });
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const labels = await prisma.label.findMany({
    where: { workspaceId: id },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(labels);
}

// POST /api/workspaces/[id]/labels — create a label
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { name, color } = await req.json();
  if (!name?.trim() || !color) {
    return NextResponse.json({ error: "name and color required" }, { status: 400 });
  }

  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId: id, userId: session.user.id } },
  });
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const label = await prisma.label.create({
      data: { name: name.trim(), color, workspaceId: id },
    });
    return NextResponse.json(label, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Label name already exists in this workspace" }, { status: 409 });
  }
}
