import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { updateMomentSchema } from "@/lib/validations/moment";

// Next.js 15: dynamic route params are async and must be awaited.
type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // userId is part of the where clause, not a check applied after the
  // fetch — this is what keeps a user from ever being able to distinguish
  // "doesn't exist" from "exists but isn't yours" via a 404 either way.
  const moment = await prisma.moment.findFirst({
    where: { id, userId: session.user.id },
    include: { tags: true },
  });

  if (!moment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(moment);
}

export async function PATCH(req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const userId = session.user.id;

  const existing = await prisma.moment.findFirst({ where: { id, userId } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = updateMomentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { content, tags } = parsed.data;

  const moment = await prisma.moment.update({
    where: { id },
    data: {
      ...(content !== undefined ? { content } : {}),
      ...(tags !== undefined
        ? {
            tags: {
              // Fully replace the tag set: disconnect everything, then
              // reconnect (or create) the incoming list. Simpler and less
              // error-prone than diffing old vs. new tags by hand.
              set: [],
              connectOrCreate: tags.map((name) => ({
                where: { userId_name: { userId, name } },
                create: { userId, name },
              })),
            },
          }
        : {}),
    },
    include: { tags: true },
  });

  // Seam for Phase 4: if `content` changed, the old embedding is stale —
  // re-enqueue EMBED + SUMMARIZE jobs here once the AI worker exists.

  return NextResponse.json(moment);
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.moment.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // MomentEmbedding and AIJob rows cascade on delete (see schema.prisma's
  // onDelete: Cascade on both relations) — nothing extra to clean up here.
  await prisma.moment.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
