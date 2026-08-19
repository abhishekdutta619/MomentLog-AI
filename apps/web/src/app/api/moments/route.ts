import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createMomentSchema } from "@/lib/validations/moment";
import { fetchCurrentWeather } from "@/lib/weather";

const PAGE_SIZE = 20;

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const tag = searchParams.get("tag");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const cursor = searchParams.get("cursor");

  const moments = await prisma.moment.findMany({
    where: {
      userId: session.user.id,
      ...(tag ? { tags: { some: { name: tag } } } : {}),
      ...(from || to
        ? {
            createdAt: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
    },
    include: { tags: true },
    orderBy: { createdAt: "desc" },
    take: PAGE_SIZE + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = moments.length > PAGE_SIZE;
  const items = hasMore ? moments.slice(0, PAGE_SIZE) : moments;

  return NextResponse.json({
    moments: items,
    nextCursor: hasMore ? items[items.length - 1].id : null,
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createMomentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { content, tags, moodScore, latitude, longitude } = parsed.data;
  const userId = session.user.id;

  // Weather is best-effort: if coordinates weren't sent (geolocation
  // denied/unavailable client-side) or the fetch fails, weather is simply
  // null on this Moment — never blocks the save.
  const weather =
    latitude !== undefined && longitude !== undefined
      ? await fetchCurrentWeather(latitude, longitude)
      : null;

  const moment = await prisma.moment.create({
    data: {
      userId,
      content,
      moodScore: moodScore ?? null,
      weatherTempC: weather?.tempC ?? null,
      weatherCondition: weather?.condition ?? null,
      weatherIcon: weather?.icon ?? null,
      tags: {
        connectOrCreate: tags.map((name) => ({
          where: { userId_name: { userId, name } },
          create: { userId, name },
        })),
      },
    },
    include: { tags: true },
  });

  // Seam for Phase 4: enqueue EMBED + SUMMARIZE AIJob rows in the same
  // transaction as the create above, once the AI provider is chosen.

  return NextResponse.json(moment, { status: 201 });
}
