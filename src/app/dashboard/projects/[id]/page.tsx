import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import KanbanBoard from "@/components/KanbanBoard";
import AISummaryButton from "@/components/AISummaryButton";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      tasks: {
        include: { assignee: { select: { id: true, name: true, image: true } } },
        orderBy: { createdAt: "asc" },
      },
      aiSummaries: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  if (!project) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
          {project.description && (
            <p className="mt-1 text-sm text-gray-500">{project.description}</p>
          )}
        </div>
        <AISummaryButton projectId={project.id} />
      </div>

      {project.aiSummaries[0] && (
        <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4">
          <p className="text-xs font-medium text-indigo-600 uppercase tracking-wide">AI Summary</p>
          <p className="mt-1 text-sm text-gray-700">{project.aiSummaries[0].content}</p>
        </div>
      )}

      <KanbanBoard projectId={project.id} initialTasks={project.tasks} />
    </div>
  );
}
