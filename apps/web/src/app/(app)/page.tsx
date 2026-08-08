import { auth } from "@/lib/auth";

function getGreeting(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

const MOODS = [
  { emoji: "😊", label: "Great" },
  { emoji: "🙂", label: "Good" },
  { emoji: "😐", label: "Okay" },
  { emoji: "😔", label: "Difficult" },
];

// Deliberately no fake data anywhere on this page. Every section either
// shows something real (greeting, date) or an honest empty state pointing
// at the phase that will fill it in — see docs/PRD.md Section 5 ("quiet
// dashboard") and the brand doc's morning/evening mockups.
export default async function DashboardPage() {
  const session = await auth();
  const firstName = (session?.user?.name ?? session?.user?.email ?? "").split(" ")[0];

  const now = new Date();
  const greeting = getGreeting(now.getHours());
  const dateLabel = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="mx-auto max-w-2xl space-y-10">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          {greeting}
          {firstName ? `, ${firstName}` : ""}.
        </h1>
        <p className="text-sm text-muted-foreground">{dateLabel}</p>
      </div>

      <section>
        <p className="mb-3 text-sm text-muted-foreground">How are you feeling today?</p>
        <div className="flex gap-3">
          {MOODS.map((mood) => (
            <a
              key={mood.label}
              href="/moments"
              title={mood.label}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-border text-xl transition-colors hover:bg-muted"
            >
              {mood.emoji}
            </a>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-foreground">Today&apos;s focus</h2>
        <p className="text-sm text-muted-foreground">
          No tasks yet — task tracking arrives in Phase 2.
        </p>
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
