import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import ActivityFeedView from "@/components/ActivityFeedView";
import type { ActivityEntry } from "@/components/ActivityFeedView";

export default async function ActivityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const session = await auth();
  if (!session?.user?.id) notFound();

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      workspace: { include: { members: { select: { userId: true } } } },
    },
  });

  if (!project) notFound();

  const isMember = project.workspace.members.some((m) => m.userId === session.user!.id);
  if (!isMember) notFound();

  const rawActivities = await prisma.activityLog.findMany({
    where: { projectId: id },
    include: { user: { select: { id: true, name: true, image: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const activities: ActivityEntry[] = rawActivities.map((a) => ({
    id: a.id,
    type: a.type as ActivityEntry["type"],
    meta: a.meta as Record<string, unknown>,
    createdAt: a.createdAt.toISOString(),
    user: a.user,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{project.name}</h1>
        {project.description && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{project.description}</p>
        )}
      </div>

      <ActivityFeedView activities={activities} />
    </div>
  );
}
