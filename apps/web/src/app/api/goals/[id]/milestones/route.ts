import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createMilestoneSchema } from "@/lib/validations/goal";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: goalId } = await params;

  // Milestone has no userId of its own — ownership is indirect through
  // its parent Goal, so the ownership check happens on the Goal here
  // rather than on a Milestone row (which doesn't exist yet anyway).
  const goal = await prisma.goal.findFirst({
    where: { id: goalId, userId: session.user.id },
    include: { milestones: true },
  });
  if (!goal) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = createMilestoneSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  // No drag-and-drop reordering in MVP scope — order just tracks creation
  // sequence, appended to the end of the current list.
  const nextOrder = goal.milestones.length;

  const milestone = await prisma.milestone.create({
    data: {
      goalId,
      title: parsed.data.title,
      order: nextOrder,
    },
  });

  return NextResponse.json(milestone, { status: 201 });
}
