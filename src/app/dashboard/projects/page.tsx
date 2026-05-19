import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { FolderKanban } from "lucide-react";
import CreateWorkspaceButton from "@/components/CreateWorkspaceButton";
import CreateProjectButton from "@/components/CreateProjectButton";
import WorkspaceActions from "@/components/WorkspaceActions";

export default async function ProjectsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const memberships = await prisma.workspaceMember.findMany({
    where: { userId: session.user.id },
    include: {
      workspace: {
        include: {
          projects: {
            include: { _count: { select: { tasks: true } } },
            orderBy: { createdAt: "desc" },
          },
        },
      },
    },
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Projects</h1>
        <CreateWorkspaceButton />
      </div>

      {memberships.map(({ workspace, role }) => (
        <div key={workspace.id}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              {workspace.name}
            </h2>
            <WorkspaceActions
              workspaceId={workspace.id}
              workspaceName={workspace.name}
              isOwner={role === "OWNER"}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {workspace.projects.map((project) => (
              <Link
                key={project.id}
                href={`/dashboard/projects/${project.id}`}
                className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-5 transition-all hover:border-indigo-200 hover:shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:hover:border-indigo-700"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-indigo-50 p-2 dark:bg-indigo-950">
                    <FolderKanban className="h-4 w-4 text-indigo-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">{project.name}</h3>
                </div>
                {project.description && (
                  <p className="line-clamp-2 text-sm text-gray-500 dark:text-gray-400">{project.description}</p>
                )}
                <span className="mt-auto text-xs text-gray-400 dark:text-gray-500">{project._count.tasks} tasks</span>
              </Link>
            ))}
            <CreateProjectButton workspaceId={workspace.id} />
          </div>
        </div>
      ))}

      {memberships.length === 0 && (
        <div className="rounded-2xl border border-dashed border-gray-300 py-16 text-center dark:border-gray-700">
          <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">No workspaces yet.</p>
          <div className="mt-4 flex justify-center">
            <CreateWorkspaceButton />
          </div>
        </div>
      )}
    </div>
  );
}
