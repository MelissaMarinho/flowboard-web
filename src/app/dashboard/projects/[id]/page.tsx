import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import KanbanBoard from "@/components/KanbanBoard";
import AISummaryButton from "@/components/AISummaryButton";
import AIPrioritizeButton from "@/components/AIPrioritizeButton";
import ExportCsvButton from "@/components/ExportCsvButton";

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

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{project.name}</h1>
          {project.description && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{project.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <ExportCsvButton projectId={project.id} projectName={project.name} />
          <AIPrioritizeButton projectId={project.id} />
          <AISummaryButton projectId={project.id} />
        </div>
      </div>

      {project.aiSummaries[0] && (
        <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4 dark:border-indigo-800 dark:bg-indigo-950">
          <p className="text-xs font-medium uppercase tracking-wide text-indigo-600 dark:text-indigo-400">AI Summary</p>
          <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{project.aiSummaries[0].content}</p>
        </div>
      )}

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
