"use client";

import { useEffect, useState } from "react";

function getGreeting(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

// Computed in useEffect (client-only, post-hydration) rather than during
// render — a Server Component's Date.now() reflects the server's clock,
// not the visitor's, and computing it in a plain client component render
// would still use whatever time the server had during SSR, then risk a
// hydration mismatch if the client re-render disagreed. Rendering a
// neutral fallback first, then swapping in the real local greeting once
// mounted, is the standard fix for any value that depends on the
// browser's clock/timezone rather than the server's. Same underlying
// class of bug as the calendar page's UTC-consistency handling — just
// solved the opposite way (client-local here vs. deliberately-shared-UTC
// there), because a greeting should reflect the *visitor's* morning,
// while a calendar day needs both sides of the app to agree on one.
export function DashboardGreeting({ firstName }: { firstName: string }) {
  const [label, setLabel] = useState<{ greeting: string; date: string } | null>(null);

  useEffect(() => {
    const now = new Date();
    setLabel({
      greeting: getGreeting(now.getHours()),
      date: now.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      }),
    });
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">
        {label ? label.greeting : "Hello"}
        {firstName ? `, ${firstName}` : ""}.
      </h1>
      <p className="text-sm text-muted-foreground">{label ? label.date : "\u00A0"}</p>
    </div>
  );
}
