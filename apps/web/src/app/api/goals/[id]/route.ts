import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { updateGoalSchema } from "@/lib/validations/goal";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const userId = session.user.id;

  const existing = await prisma.goal.findFirst({ where: { id, userId } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = updateGoalSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { title, description, targetDate } = parsed.data;

  const goal = await prisma.goal.update({
    where: { id },
    data: {
      ...(title !== undefined ? { title } : {}),
      // Normalize "" to null, same as the create route — an edited-empty
      // description should read the same as "never had one," not become
      // a distinct empty-string state a UI would have to special-case.
      ...(description !== undefined ? { description: description || null } : {}),
      ...(targetDate !== undefined
        ? { targetDate: targetDate ? new Date(`${targetDate}T00:00:00.000Z`) : null }
        : {}),
    },
    include: { milestones: { orderBy: { order: "asc" } } },
  });

  return NextResponse.json(goal);
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.goal.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Milestones cascade on delete (see schema.prisma) — nothing extra to
  // clean up here.
  await prisma.goal.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
