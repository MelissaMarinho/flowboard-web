import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: workspaceId } = await params;
  const { email } = await req.json();

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  // Only workspace owners can invite
  const callerMembership = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: session.user.id } },
  });
  if (!callerMembership || callerMembership.role !== "OWNER") {
    return NextResponse.json({ error: "Only workspace owners can invite members" }, { status: 403 });
  }

  // Find the user to invite
  const invitee = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    select: { id: true, name: true, email: true },
  });
  if (!invitee) {
    return NextResponse.json(
      { error: "No account found for that email. They need to sign up first." },
      { status: 404 }
    );
  }

  // Check not already a member
  const existing = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: invitee.id } },
  });
  if (existing) {
    return NextResponse.json({ error: "This person is already a member." }, { status: 409 });
  }

  const member = await prisma.workspaceMember.create({
    data: { workspaceId, userId: invitee.id, role: "MEMBER" },
    include: { user: { select: { id: true, name: true, email: true, image: true } } },
  });

  return NextResponse.json(member, { status: 201 });
}
