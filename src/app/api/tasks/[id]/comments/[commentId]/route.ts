import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { commentId } = await params;

  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) return new NextResponse(null, { status: 204 });
  if (comment.userId !== session.user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.comment.delete({ where: { id: commentId } });
  return new NextResponse(null, { status: 204 });
}
