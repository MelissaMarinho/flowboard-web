import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  if (!q || q.length < 1) return NextResponse.json([]);

  const tasks = await prisma.task.findMany({
    where: {
      title: { contains: q, mode: "insensitive" },
      project: {
        workspace: { members: { some: { userId: session.user.id } } },
      },
    },
    select: {
      id: true,
      title: true,
      number: true,
      priority: true,
      projectId: true,
      project: { select: { name: true, key: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 15,
  });

  return NextResponse.json(
    tasks.map((t) => ({
      id: t.id,
      title: t.title,
      number: t.number,
      priority: t.priority,
      projectId: t.projectId,
      projectName: t.project.name,
      projectKey: t.project.key,
    })),
  );
}
