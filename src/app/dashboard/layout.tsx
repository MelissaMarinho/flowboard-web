import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Sidebar from "@/components/Sidebar";
import CommandPalette from "@/components/CommandPalette";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const memberships = await prisma.workspaceMember.findMany({
    where: { userId: session.user.id },
    include: { workspace: { select: { id: true, name: true, slug: true } } },
    orderBy: { joinedAt: "asc" },
  });

  const workspaces = memberships.map((m) => m.workspace);
  const workspaceIds = workspaces.map((w) => w.id);

  const overdueCount =
    workspaceIds.length > 0
      ? await prisma.task.count({
          where: {
            dueDate: { lt: new Date() },
            status: { not: "DONE" },
            project: { workspaceId: { in: workspaceIds } },
          },
        })
      : 0;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      <Sidebar user={session.user} workspaces={workspaces} overdueCount={overdueCount} />
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
      <CommandPalette />
    </div>
  );
}
