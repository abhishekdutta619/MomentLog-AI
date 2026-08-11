"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

function getMonthGrid(year: number, month: number) {
  const firstDay = new Date(Date.UTC(year, month, 1));
  const lastDay = new Date(Date.UTC(year, month + 1, 0));
  const daysInMonth = lastDay.getUTCDate();
  const startWeekday = firstDay.getUTCDay();

  const cells: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function formatMonthKey(year: number, month: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

function formatDayKey(year: number, month: number, day: number) {
  return `${formatMonthKey(year, month)}-${String(day).padStart(2, "0")}`;
}

// Discrete opacity steps on the brand's single primary color, not a
// separate red-to-green palette — a traffic-light mood scale would clash
// hard with the brand's deliberately restrained, no-bright-colors
// aesthetic (see docs on brand philosophy: "no gradients"). Darker/fuller
// dot = better average mood that day; a day with entries but no mood
// recorded on any of them gets a neutral gray dot instead of guessing.
function moodDotClass(avgMood: number | null) {
  if (avgMood === null) return "bg-muted-foreground";
  if (avgMood < 1.5) return "bg-primary/30";
  if (avgMood < 2.5) return "bg-primary/50";
  if (avgMood < 3.5) return "bg-primary/65";
  if (avgMood < 4.5) return "bg-primary/80";
  return "bg-primary";
}

interface DayInfo {
  count: number;
  avgMood: number | null;
}

export default function CalendarPage() {
  const router = useRouter();
  const today = new Date();
  const [year, setYear] = useState(today.getUTCFullYear());
  const [month, setMonth] = useState(today.getUTCMonth()); // 0-indexed

  const [days, setDays] = useState<Record<string, DayInfo>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const monthKey = formatMonthKey(year, month);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/moments/calendar?month=${monthKey}`);
      if (!res.ok) throw new Error("Couldn't load the calendar.");
      const data = await res.json();
      setDays(data.days);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [monthKey]);

  useEffect(() => {
    load();
  }, [load]);

  function goToPreviousMonth() {
    if (month === 0) {
      setYear((y) => y - 1);
      setMonth(11);
    } else {
      setMonth((m) => m - 1);
    }
  }

  function goToNextMonth() {
    if (month === 11) {
      setYear((y) => y + 1);
      setMonth(0);
    } else {
      setMonth((m) => m + 1);
    }
  }

  const cells = getMonthGrid(year, month);
  const monthLabel = new Date(Date.UTC(year, month, 1)).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  const todayKey = formatDayKey(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate()
  );

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">{monthLabel}</h1>
        <div className="flex items-center gap-1">
          <button
            onClick={goToPreviousMonth}
            aria-label="Previous month"
            className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={goToNextMonth}
            aria-label="Next month"
            className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
        {WEEKDAY_LABELS.map((label, i) => (
          <div key={i} className="py-2">
            {label}
          </div>
        ))}
      </div>

      <div className={cn("grid grid-cols-7 gap-1", loading && "opacity-50")}>
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />;

          const dayKey = formatDayKey(year, month, day);
          const info = days[dayKey];
          const count = info?.count ?? 0;
          const isToday = dayKey === todayKey;

          return (
            <button
              key={i}
              onClick={() => router.push(`/moments?date=${dayKey}`)}
              disabled={count === 0}
              className={cn(
                "flex aspect-square flex-col items-center justify-center rounded-md text-sm transition-colors",
                count > 0
                  ? "cursor-pointer text-foreground hover:bg-muted"
                  : "cursor-default text-muted-foreground",
                isToday && "font-semibold"
              )}
            >
              <span>{day}</span>
              {count > 0 && (
                <span className={cn("mt-0.5 h-1 w-1 rounded-full", moodDotClass(info?.avgMood ?? null))} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
