import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import KanbanBoard from "@/components/KanbanBoard";
import ProjectNav from "@/components/ProjectNav";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      workspace: {
        include: {
          members: {
            include: { user: { select: { id: true, name: true, image: true } } },
          },
        },
      },
      tasks: {
        include: {
          assignee: { select: { id: true, name: true, image: true } },
          labels: { include: { label: { select: { id: true, name: true, color: true } } } },
          subTasks: { select: { done: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      aiSummaries: { orderBy: { createdAt: "desc" }, take: 1 },
      columns: { orderBy: { order: "asc" } },
    },
  });

  if (!project) notFound();

  const members = project.workspace.members.map((m) => m.user);
  const workspaceLabels = await prisma.label.findMany({
    where: { workspaceId: project.workspace.id },
    orderBy: { name: "asc" },
  });

  const latestSummary = project.aiSummaries[0] ?? null;

  return (
    <div className="space-y-0">
      <ProjectNav
        projectId={project.id}
        projectName={project.name}
        projectKey={project.key}
        initialSummary={latestSummary?.content ?? null}
        initialSummaryAt={latestSummary?.createdAt?.toISOString() ?? null}
      />

      <KanbanBoard
        projectId={project.id}
        workspaceId={project.workspace.id}
        projectKey={project.key ?? undefined}
        initialTasks={project.tasks}
        initialColumns={project.columns}
        members={members}
        workspaceLabels={workspaceLabels}
      />
    </div>
  );
}
