import { z } from "zod";

// Tags are lowercased here, not just trimmed — otherwise "Work" and "work"
// become two different Tag rows under the @@unique([userId, name])
// constraint, which is exactly the kind of near-duplicate the tag system
// is supposed to prevent.
const tagSchema = z
  .string()
  .trim()
  .min(1)
  .max(50)
  .transform((s) => s.toLowerCase());

  // Matches the 5-point scale in lib/moods.ts — 1 (very difficult) to
// 5 (great). Optional and nullable: a Moment doesn't require a mood, and
// an update needs to be able to clear one that was previously set.
const moodScoreSchema = z.number().int().min(1).max(5);

export const createMomentSchema = z.object({
  content: z.string().trim().min(1, "Write something before saving.").max(20000),
  tags: z.array(tagSchema).max(10).optional().default([]),
  moodScore: moodScoreSchema.nullable().optional(),
});

export const updateMomentSchema = z.object({
  content: z.string().trim().min(1, "Write something before saving.").max(20000).optional(),
  tags: z.array(tagSchema).max(10).optional(),
  moodScore: moodScoreSchema.nullable().optional(),
});
