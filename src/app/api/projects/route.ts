import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function deriveKey(name: string): string {
  const words = name.trim().split(/[\s\-_]+/).filter(Boolean);
  const raw =
    words.length >= 2
      ? words.map((w) => w[0]).join("")
      : words[0] ?? "";
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 5) || "PROJ";
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get("workspaceId");
  if (!workspaceId) return NextResponse.json({ error: "workspaceId required" }, { status: 400 });

  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: session.user!.id } },
  });
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const projects = await prisma.project.findMany({
    where: { workspaceId },
    include: { _count: { select: { tasks: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(projects);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, description, workspaceId, key: rawKey } = await req.json();
  if (!name || !workspaceId) return NextResponse.json({ error: "name and workspaceId required" }, { status: 400 });

  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: session.user!.id } },
  });
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Derive key: use user-provided value, fall back to auto-generated
  let key = (rawKey ?? deriveKey(name)).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 5) || deriveKey(name);

  // If key already taken in this workspace, append a numeric suffix
  const existing = await prisma.project.findFirst({ where: { workspaceId, key } });
  if (existing) {
    const count = await prisma.project.count({ where: { workspaceId, key: { startsWith: key } } });
    key = `${key}${count + 1}`;
  }

  const project = await prisma.project.create({
    data: { name, description, workspaceId, key },
  });

  return NextResponse.json(project, { status: 201 });
}
