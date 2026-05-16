import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { projectId } = await req.json();
  if (!projectId) return NextResponse.json({ error: "projectId required" }, { status: 400 });

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { tasks: true },
  });
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const aiServiceUrl = process.env.AI_SERVICE_URL ?? "http://localhost:8000";

  const aiRes = await fetch(`${aiServiceUrl}/summarize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      project_name: project.name,
      tasks: project.tasks.map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate,
      })),
    }),
  });

  if (!aiRes.ok) return NextResponse.json({ error: "AI service error" }, { status: 502 });

  const { summary } = await aiRes.json();

  const saved = await prisma.aISummary.create({
    data: { projectId, content: summary, createdBy: session.user.id },
  });

  return NextResponse.json(saved, { status: 201 });
}
