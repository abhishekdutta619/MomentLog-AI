import { z } from "zod";

// Accepts a plain YYYY-MM-DD date (matching <input type="date">), not a
// full ISO datetime — a task's due date doesn't need a time component,
// and requiring one would just push that complexity onto the client for
// no benefit. Converted to a UTC midnight Date server-side.
const dueDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "dueDate must be in YYYY-MM-DD format")
  .nullable();

const prioritySchema = z.enum(["LOW", "MEDIUM", "HIGH"]);

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, "Give the task a title.").max(500),
  priority: prioritySchema.optional().default("MEDIUM"),
  dueDate: dueDateSchema.optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().trim().min(1, "Give the task a title.").max(500).optional(),
  priority: prioritySchema.optional(),
  dueDate: dueDateSchema.optional(),
  completed: z.boolean().optional(),
});
