import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { DashboardGreeting } from "@/components/dashboard-greeting";
import { MOOD_OPTIONS } from "@/lib/moods";

const PRIORITY_LABELS: Record<string, string> = {
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
};

// Deliberately no fake data anywhere on this page. Every section either
// shows something real (greeting, date, now: actual tasks) or an honest
// empty state pointing at the phase that will fill it in — see
// docs/PRD.md Section 5 ("quiet dashboard").
export default async function DashboardPage() {
  const session = await auth();
  const firstName = (session?.user?.name ?? session?.user?.email ?? "").split(" ")[0];

  // Postgres enums sort by their declaration order in schema.prisma
  // (LOW, MEDIUM, HIGH) — not alphabetically — so `priority: "desc"` here
  // genuinely means "highest priority first," not a lucky coincidence.
  const tasks = session?.user
    ? await prisma.task.findMany({
        where: { userId: session.user.id, completed: false },
        orderBy: [{ priority: "desc" }, { dueDate: { sort: "asc", nulls: "last" } }],
        take: 3,
      })
    : [];

  return (
    <div className="mx-auto max-w-2xl space-y-10">
      <DashboardGreeting firstName={firstName} />

      <section>
        <p className="mb-3 text-sm text-muted-foreground">How are you feeling today?</p>
        <div className="flex gap-3">
          {MOOD_OPTIONS.map((mood) => (
            <a
              key={mood.score}
              href={`/moments?mood=${mood.score}`}
              title={`Write about feeling ${mood.label.toLowerCase()}`}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-border text-xl transition-colors hover:bg-muted"
            >
              {mood.emoji}
            </a>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-foreground">Today&apos;s focus</h2>
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No open tasks.{" "}
            <a href="/tasks" className="underline">
              Add one
            </a>
            .
          </p>
        ) : (
          <ul className="space-y-1.5">
            {tasks.map((task) => (
              <li key={task.id} className="text-sm text-foreground">
                <a href="/tasks" className="hover:underline">
                  {task.title}
                </a>
                <span className="ml-2 text-xs text-muted-foreground">
                  {PRIORITY_LABELS[task.priority]}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-foreground">
          A moment from your recent life
        </h2>
        <p className="text-sm text-muted-foreground">
          Nothing here yet.{" "}
          <a href="/moments" className="underline">
            Write your first Moment
          </a>{" "}
          and it&apos;ll show up here.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-foreground">✦ A small insight</h2>
        <p className="text-sm text-muted-foreground">
          Insights appear once MomentLog has a few entries to learn from.
        </p>
      </section>
    </div>
  );
}
