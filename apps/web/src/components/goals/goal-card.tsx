"use client";

import { useState, useEffect } from "react";
import { GoalComposer } from "./goal-composer";
import { MilestoneList } from "./milestone-list";
import type { Goal } from "@/types/goal";

function formatTargetDate(dateOnly: string) {
  return new Date(`${dateOnly}T00:00:00.000Z`).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function GoalCard({
  goal,
  onUpdate,
  onDelete,
  onAddMilestone,
  onToggleMilestone,
  onDeleteMilestone,
}: {
  goal: Goal;
  onUpdate: (
    id: string,
    data: { title: string; description: string; targetDate: string | null }
  ) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onAddMilestone: (goalId: string, title: string) => Promise<void>;
  onToggleMilestone: (goalId: string, milestoneId: string, completed: boolean) => Promise<void>;
  onDeleteMilestone: (goalId: string, milestoneId: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!confirmingDelete) return;
    const timer = setTimeout(() => setConfirmingDelete(false), 4000);
    return () => clearTimeout(timer);
  }, [confirmingDelete]);

  if (editing) {
    return (
      <div className="border-b border-border py-6">
        <GoalComposer
          initialTitle={goal.title}
          initialDescription={goal.description ?? ""}
          initialTargetDate={goal.targetDate ? goal.targetDate.slice(0, 10) : null}
          saveLabel="Save changes"
          onCancel={() => setEditing(false)}
          onSave={async (data) => {
            await onUpdate(goal.id, data);
            setEditing(false);
          }}
        />
      </div>
    );
  }

  const total = goal.milestones.length;
  const completed = goal.milestones.filter((m) => m.completed).length;
  const progressPct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="border-b border-border py-6">
      <p className="text-sm font-medium text-foreground">{goal.title}</p>
      {goal.description && (
        <p className="mt-1 text-sm text-muted-foreground">{goal.description}</p>
      )}
      {goal.targetDate && (
        <p className="mt-1 text-xs text-muted-foreground">
          Target: {formatTargetDate(goal.targetDate.slice(0, 10))}
        </p>
      )}

      {total > 0 && (
        <div className="mt-3">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {completed} of {total} milestones
          </p>
        </div>
      )}

      <MilestoneList
        milestones={goal.milestones}
        onAdd={(title) => onAddMilestone(goal.id, title)}
        onToggle={(milestoneId, completed) => onToggleMilestone(goal.id, milestoneId, completed)}
        onDelete={(milestoneId) => onDeleteMilestone(goal.id, milestoneId)}
      />

      <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
        <button onClick={() => setEditing(true)} className="hover:text-foreground hover:underline">
          Edit
        </button>
        {confirmingDelete ? (
          <button
            onClick={async () => {
              setDeleting(true);
              await onDelete(goal.id);
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
  );
}
