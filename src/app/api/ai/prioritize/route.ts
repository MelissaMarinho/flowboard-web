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

  if (project.tasks.length === 0) {
    return NextResponse.json({ suggestions: [] });
  }

  const aiServiceUrl = process.env.AI_SERVICE_URL ?? "http://localhost:8000";

  const aiRes = await fetch(`${aiServiceUrl}/prioritize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tasks: project.tasks.map((t) => ({
        id: t.id,
        title: t.title,
        priority: t.priority,
        dueDate: t.dueDate,
      })),
    }),
  });

  if (!aiRes.ok) return NextResponse.json({ error: "AI service error" }, { status: 502 });

  const { suggestions } = await aiRes.json();
  return NextResponse.json({ suggestions });
}
