"use client";

import { useState } from "react";
import { Plus, X, Circle, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Milestone } from "@/types/goal";

export function MilestoneList({
  milestones,
  onAdd,
  onToggle,
  onDelete,
}: {
  milestones: Milestone[];
  onAdd: (title: string) => Promise<void>;
  onToggle: (milestoneId: string, completed: boolean) => Promise<void>;
  onDelete: (milestoneId: string) => Promise<void>;
}) {
  const [draft, setDraft] = useState("");
  const [adding, setAdding] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    setAdding(true);
    try {
      await onAdd(draft.trim());
      setDraft("");
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="mt-3 space-y-2">
      {milestones.map((m) => (
        <div key={m.id} className="flex items-center gap-2 text-sm">
          <button
            onClick={() => onToggle(m.id, !m.completed)}
            aria-label={m.completed ? "Mark incomplete" : "Mark complete"}
            className="text-muted-foreground hover:text-foreground"
          >
            {m.completed ? (
              <CheckCircle2 className="h-4 w-4 text-primary" />
            ) : (
              <Circle className="h-4 w-4" />
            )}
          </button>
          <span className={cn("flex-1", m.completed && "text-muted-foreground line-through")}>
            {m.title}
          </span>
          <button
            onClick={() => onDelete(m.id)}
            aria-label="Delete milestone"
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}

      <form onSubmit={handleAdd} className="flex items-center gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a milestone..."
          className="h-8 text-xs"
        />
        <button
          type="submit"
          disabled={adding || !draft.trim()}
          aria-label="Add milestone"
          className="text-muted-foreground hover:text-foreground disabled:opacity-40"
        >
          <Plus className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
