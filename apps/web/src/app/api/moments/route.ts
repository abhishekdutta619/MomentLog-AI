import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createMomentSchema } from "@/lib/validations/moment";

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
    take: PAGE_SIZE + 1, // fetch one extra to know if there's a next page
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

  const { content, tags, moodScore } = parsed.data;
  const userId = session.user.id;

  const moment = await prisma.moment.create({
    data: {
      userId,
      content,
      moodScore: moodScore ?? null,
      tags: {
        connectOrCreate: tags.map((name) => ({
          where: { userId_name: { userId, name } },
          create: { userId, name },
        })),
      },
    },
    include: { tags: true },
  });

  // Seam for later phases: Phase 3 attaches weather here (server-side fetch
  // before/after create), Phase 4 enqueues EMBED + SUMMARIZE AIJob rows in
  // the same transaction as the create above. Neither exists yet — both
  // depend on the still-open AI-provider and weather-API decisions.

  return NextResponse.json(moment, { status: 201 });
}
