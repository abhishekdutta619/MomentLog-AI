"use client";

import { cn } from "@/lib/utils";
import { MOOD_OPTIONS } from "@/lib/moods";

export function MoodPicker({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (score: number | null) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      {MOOD_OPTIONS.map((mood) => (
        <button
          key={mood.score}
          type="button"
          // Clicking the already-selected mood clears it — mood is
          // optional on a Moment, so there needs to be a way back to
          // "no mood recorded" without a separate clear button.
          onClick={() => onChange(value === mood.score ? null : mood.score)}
          title={mood.label}
          aria-pressed={value === mood.score}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full border text-lg transition-colors",
            value === mood.score
              ? "border-primary bg-muted"
              : "border-border hover:bg-muted"
          )}
        >
          {mood.emoji}
        </button>
      ))}
    </div>
  );
}
