// Single source of truth for the mood scale. Previously the dashboard had
// its own hardcoded 4-emoji list that had drifted from the brand doc's
// actual 5-point scale (Great/Good/Okay/Difficult/Very difficult) — this
// file exists specifically so the picker, the card display, and the
// dashboard can't disagree with each other again.
export const MOOD_OPTIONS = [
  { score: 1, emoji: "😣", label: "Very difficult" },
  { score: 2, emoji: "😔", label: "Difficult" },
  { score: 3, emoji: "😐", label: "Okay" },
  { score: 4, emoji: "🙂", label: "Good" },
  { score: 5, emoji: "😊", label: "Great" },
] as const;

export function getMoodEmoji(score: number | null | undefined): string | null {
  if (score == null) return null;
  return MOOD_OPTIONS.find((m) => m.score === score)?.emoji ?? null;
}
