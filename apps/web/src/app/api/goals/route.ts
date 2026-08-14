import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createGoalSchema } from "@/lib/validations/goal";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const goals = await prisma.goal.findMany({
    where: { userId: session.user.id },
    include: {
      milestones: { orderBy: { order: "asc" } },
    },
    orderBy: [
      { targetDate: { sort: "asc", nulls: "last" } },
      { createdAt: "desc" },
    ],
  });

  return NextResponse.json(goals);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createGoalSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { title, description, targetDate } = parsed.data;

  const goal = await prisma.goal.create({
    data: {
      userId: session.user.id,
      title,
      description: description || null,
      targetDate: targetDate ? new Date(`${targetDate}T00:00:00.000Z`) : null,
    },
    include: { milestones: true },
  });

  return NextResponse.json(goal, { status: 201 });
}
