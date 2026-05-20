import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import AIChatView from "@/components/AIChatView";
import ProjectNav from "@/components/ProjectNav";

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const session = await auth();
  if (!session?.user?.id) notFound();

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      workspace: {
        include: { members: { select: { userId: true } } },
      },
    },
  });

  if (!project) notFound();

  const isMember = project.workspace.members.some((m) => m.userId === session.user!.id);
  if (!isMember) notFound();

  return (
    <div className="space-y-0">
      <ProjectNav
        projectId={project.id}
        projectName={project.name}
        projectKey={project.key}
      />
      <AIChatView projectId={project.id} projectName={project.name} />
    </div>
  );
}
