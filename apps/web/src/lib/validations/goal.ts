import { z } from "zod";

const targetDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "targetDate must be in YYYY-MM-DD format")
  .nullable();

export const createGoalSchema = z.object({
  title: z.string().trim().min(1, "Give the goal a title.").max(200),
  description: z.string().trim().max(2000).optional(),
  targetDate: targetDateSchema.optional(),
});

export const updateGoalSchema = z.object({
  title: z.string().trim().min(1, "Give the goal a title.").max(200).optional(),
  description: z.string().trim().max(2000).optional(),
  targetDate: targetDateSchema.optional(),
});

export const createMilestoneSchema = z.object({
  title: z.string().trim().min(1, "Give the milestone a title.").max(200),
});

export const updateMilestoneSchema = z.object({
  title: z.string().trim().min(1, "Give the milestone a title.").max(200).optional(),
  completed: z.boolean().optional(),
});
