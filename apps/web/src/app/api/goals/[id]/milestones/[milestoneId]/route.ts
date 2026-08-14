import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { updateMilestoneSchema } from "@/lib/validations/goal";

type RouteParams = { params: Promise<{ id: string; milestoneId: string }> };

// Joins through Goal to confirm ownership — a Milestone's own goalId
// alone isn't proof it belongs to this user; only combined with the
// parent Goal's userId is it. Prisma's relation filter (`goal: { userId }`)
// expresses that join directly instead of two separate queries.
async function findOwnedMilestone(goalId: string, milestoneId: string, userId: string) {
  return prisma.milestone.findFirst({
    where: { id: milestoneId, goalId, goal: { userId } },
  });
}

export async function PATCH(req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: goalId, milestoneId } = await params;

  const existing = await findOwnedMilestone(goalId, milestoneId, session.user.id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = updateMilestoneSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { title, completed } = parsed.data;

  const milestone = await prisma.milestone.update({
    where: { id: milestoneId },
    data: {
      ...(title !== undefined ? { title } : {}),
      ...(completed !== undefined
        ? { completed, completedAt: completed ? new Date() : null }
        : {}),
    },
  });

  return NextResponse.json(milestone);
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: goalId, milestoneId } = await params;

  const existing = await findOwnedMilestone(goalId, milestoneId, session.user.id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.milestone.delete({ where: { id: milestoneId } });

  return NextResponse.json({ success: true });
}
