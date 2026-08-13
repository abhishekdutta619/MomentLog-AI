import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createTaskSchema } from "@/lib/validations/task";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // No pagination here — unlike Moments, a task list isn't expected to
  // grow into the thousands, and "flat list" is explicitly the MVP scope
  // (see docs/PRD.md). Incomplete tasks first, then soonest-due first
  // (undated tasks sort last within each group, not scattered randomly).
  const tasks = await prisma.task.findMany({
    where: { userId: session.user.id },
    orderBy: [
      { completed: "asc" },
      { dueDate: { sort: "asc", nulls: "last" } },
      { createdAt: "desc" },
    ],
  });

  return NextResponse.json(tasks);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { title, priority, dueDate } = parsed.data;

  const task = await prisma.task.create({
    data: {
      userId: session.user.id,
      title,
      priority,
      dueDate: dueDate ? new Date(`${dueDate}T00:00:00.000Z`) : null,
    },
  });

  return NextResponse.json(task, { status: 201 });
}
