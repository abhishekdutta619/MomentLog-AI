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

export const createMomentSchema = z.object({
  content: z.string().trim().min(1, "Write something before saving.").max(20000),
  tags: z.array(tagSchema).max(10).optional().default([]),
});

export const updateMomentSchema = z.object({
  content: z.string().trim().min(1, "Write something before saving.").max(20000).optional(),
  tags: z.array(tagSchema).max(10).optional(),
});
