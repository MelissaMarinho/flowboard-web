import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function escapeCell(value: string | null | undefined): string {
  if (value == null) return "";
  const str = String(value);
  // Wrap in quotes if the value contains commas, quotes, or newlines
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Verify the user is a member of the project's workspace
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      workspace: {
        include: { members: { select: { userId: true } } },
      },
    },
  });

  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isMember = project.workspace.members.some((m) => m.userId === session.user!.id);
  if (!isMember) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const tasks = await prisma.task.findMany({
    where: { projectId: id },
    include: { assignee: { select: { name: true, email: true } } },
    orderBy: { createdAt: "asc" },
  });

  const header = ["Title", "Description", "Status", "Priority", "Assignee", "Due Date", "Created At"];

  const rows = tasks.map((t) => [
    escapeCell(t.title),
    escapeCell(t.description),
    escapeCell(t.status),
    escapeCell(t.priority),
    escapeCell(t.assignee?.name ?? t.assignee?.email ?? ""),
    escapeCell(t.dueDate ? t.dueDate.toISOString().split("T")[0] : ""),
    escapeCell(t.createdAt.toISOString().split("T")[0]),
  ]);

  const csv = [header.join(","), ...rows.map((r) => r.join(","))].join("\n");

  const slug = project.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const filename = `${slug}-tasks.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
