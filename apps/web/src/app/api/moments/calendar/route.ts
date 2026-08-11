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
    select: { id: true, createdAt: true, moodScore: true },
  });

  // Grouped by day (YYYY-MM-DD) → entry count + average mood for that day.
  // avgMood is null for days with entries but no mood recorded on any of
  // them — distinct from "no entries at all" (day simply absent from the
  // response), which the calendar UI treats differently (unclickable).
  const grouped: Record<string, { count: number; moodSum: number; moodCount: number }> = {};
  for (const m of moments) {
    const day = m.createdAt.toISOString().slice(0, 10);
    if (!grouped[day]) grouped[day] = { count: 0, moodSum: 0, moodCount: 0 };
    grouped[day].count += 1;
    if (m.moodScore != null) {
      grouped[day].moodSum += m.moodScore;
      grouped[day].moodCount += 1;
    }
  }

  const days: Record<string, { count: number; avgMood: number | null }> = {};
  for (const [day, g] of Object.entries(grouped)) {
    days[day] = {
      count: g.count,
      avgMood: g.moodCount > 0 ? Math.round((g.moodSum / g.moodCount) * 10) / 10 : null,
    };
  }

  return NextResponse.json({ month, days });
}
