import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { projectId, message, history } = await req.json();
  if (!projectId || !message)
    return NextResponse.json({ error: "projectId and message required" }, { status: 400 });

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      tasks: {
        include: { assignee: { select: { name: true } } },
        orderBy: { createdAt: "asc" },
      },
      columns: { orderBy: { order: "asc" } },
    },
  });
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const aiServiceUrl = process.env.AI_SERVICE_URL ?? "http://localhost:8000";

  const aiRes = await fetch(`${aiServiceUrl}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      project_name: project.name,
      columns: project.columns.map((c) => ({ id: c.id, name: c.name })),
      tasks: project.tasks.map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate,
        assignee: t.assignee?.name ?? null,
      })),
      message,
      history: Array.isArray(history) ? history : [],
    }),
  });

  if (!aiRes.ok) return NextResponse.json({ error: "AI service error" }, { status: 502 });

  const { reply } = await aiRes.json();
  return NextResponse.json({ reply });
}
