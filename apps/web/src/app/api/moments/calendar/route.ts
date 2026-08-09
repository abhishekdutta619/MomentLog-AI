import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month"); // expected format: "YYYY-MM"

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json(
      { error: "month must be in YYYY-MM format" },
      { status: 400 }
    );
  }

  const start = new Date(`${month}-01T00:00:00.000Z`);
  const end = new Date(start);
  end.setUTCMonth(end.getUTCMonth() + 1);

  const moments = await prisma.moment.findMany({
    where: {
      userId: session.user.id,
      createdAt: { gte: start, lt: end },
    },
    select: { id: true, createdAt: true },
  });

  // Grouped by day (YYYY-MM-DD) → entry count for that day. Mood shows up
  // here too once Phase 2 adds the mood check-in UI — for now there's
  // nothing to aggregate since moodScore has no way to be set yet.
  const days: Record<string, number> = {};
  for (const m of moments) {
    const day = m.createdAt.toISOString().slice(0, 10);
    days[day] = (days[day] ?? 0) + 1;
  }

  return NextResponse.json({ month, days });
}
