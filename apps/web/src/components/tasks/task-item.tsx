"use client";

import { useState, useEffect } from "react";
import { Circle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { TaskComposer } from "./task-composer";
import type { Task, TaskPriority } from "@/types/task";

const PRIORITY_STYLES: Record<TaskPriority, string> = {
  LOW: "text-muted-foreground",
  MEDIUM: "text-foreground",
  HIGH: "text-red-600",
};

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};

function formatDueDate(dateOnly: string) {
  return new Date(`${dateOnly}T00:00:00.000Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function isOverdue(dateOnly: string) {
  const due = new Date(`${dateOnly}T00:00:00.000Z`);
  const now = new Date();
  const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  return due < todayUTC;
}

export function TaskItem({
  task,
  onUpdate,
  onDelete,
}: {
  task: Task;
  onUpdate: (
    id: string,
    data: Partial<{
      title: string;
      priority: TaskPriority;
      dueDate: string | null;
      completed: boolean;
    }>
  ) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [togglingComplete, setTogglingComplete] = useState(false);

  useEffect(() => {
    if (!confirmingDelete) return;
    const timer = setTimeout(() => setConfirmingDelete(false), 4000);
    return () => clearTimeout(timer);
  }, [confirmingDelete]);

  if (editing) {
    return (
      <div className="border-b border-border py-4">
        <TaskComposer
          initialTitle={task.title}
          initialPriority={task.priority}
          initialDueDate={task.dueDate ? task.dueDate.slice(0, 10) : null}
          saveLabel="Save changes"
          onCancel={() => setEditing(false)}
          onSave={async (data) => {
            await onUpdate(task.id, data);
            setEditing(false);
          }}
        />
      </div>
    );
  }

  const dueDateOnly = task.dueDate ? task.dueDate.slice(0, 10) : null;
  const overdue = dueDateOnly && !task.completed && isOverdue(dueDateOnly);

  return (
    <div className="flex items-start gap-3 border-b border-border py-4">
      <button
        onClick={async () => {
          setTogglingComplete(true);
          await onUpdate(task.id, { completed: !task.completed });
          setTogglingComplete(false);
        }}
        disabled={togglingComplete}
        aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
        className="mt-0.5 text-muted-foreground hover:text-foreground"
      >
        {task.completed ? (
          <CheckCircle2 className="h-5 w-5 text-primary" />
        ) : (
          <Circle className="h-5 w-5" />
        )}
      </button>

      <div className="flex-1">
        <p
          className={cn(
            "text-sm text-foreground",
            task.completed && "text-muted-foreground line-through"
          )}
        >
          {task.title}
        </p>
        <div className="mt-1 flex items-center gap-3 text-xs">
          <span className={PRIORITY_STYLES[task.priority]}>
            {PRIORITY_LABELS[task.priority]}
          </span>
          {dueDateOnly && (
            <span className={overdue ? "text-red-600" : "text-muted-foreground"}>
              {overdue ? "Overdue: " : "Due "}
              {formatDueDate(dueDateOnly)}
            </span>
          )}
        </div>
        <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
          <button onClick={() => setEditing(true)} className="hover:text-foreground hover:underline">
            Edit
          </button>
          {confirmingDelete ? (
            <button
              onClick={async () => {
                setDeleting(true);
                await onDelete(task.id);
              }}
              disabled={deleting}
              className="text-red-600 hover:underline"
            >
              {deleting ? "Deleting..." : "Confirm delete?"}
            </button>
          ) : (
            <button
              onClick={() => setConfirmingDelete(true)}
              className="hover:text-foreground hover:underline"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
