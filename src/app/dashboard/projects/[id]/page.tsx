import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import KanbanBoard from "@/components/KanbanBoard";
import AISummaryButton from "@/components/AISummaryButton";
import AIPrioritizeButton from "@/components/AIPrioritizeButton";
import ActivityFeed from "@/components/ActivityFeed";

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
        include: { assignee: { select: { id: true, name: true, image: true } } },
        orderBy: { createdAt: "asc" },
      },
      aiSummaries: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  if (!project) notFound();

  const members = project.workspace.members.map((m) => m.user);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
          {project.description && (
            <p className="mt-1 text-sm text-gray-500">{project.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <AIPrioritizeButton projectId={project.id} />
          <AISummaryButton projectId={project.id} />
        </div>
      </div>

      {project.aiSummaries[0] && (
        <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-indigo-600">AI Summary</p>
          <p className="mt-1 text-sm text-gray-700">{project.aiSummaries[0].content}</p>
        </div>
      )}

      <KanbanBoard projectId={project.id} initialTasks={project.tasks} members={members} />

      <ActivityFeed projectId={project.id} />
    </div>
  );
}
