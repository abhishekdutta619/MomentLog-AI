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

  const { content, tags, moodScore } = parsed.data;

  const moment = await prisma.moment.update({
    where: { id },
    data: {
      ...(content !== undefined ? { content } : {}),
      // moodScore is nullable-and-optional in the schema: `undefined` means
      // "field wasn't sent, leave it alone"; `null` means "clear it". Both
      // need to be distinguishable, so this only touches moodScore when the
      // key was actually present in the parsed payload.
      ...(moodScore !== undefined ? { moodScore } : {}),
      ...(tags !== undefined
        ? {
            tags: {
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

  await prisma.moment.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
