"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TaskPriority } from "@/types/task";

const PRIORITIES: { value: TaskPriority; label: string }[] = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
];

export function TaskComposer({
  initialTitle = "",
  initialPriority = "MEDIUM",
  initialDueDate = null,
  onSave,
  onCancel,
  saveLabel = "Add task",
}: {
  initialTitle?: string;
  initialPriority?: TaskPriority;
  initialDueDate?: string | null;
  onSave: (data: {
    title: string;
    priority: TaskPriority;
    dueDate: string | null;
  }) => Promise<void>;
  onCancel?: () => void;
  saveLabel?: string;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [priority, setPriority] = useState<TaskPriority>(initialPriority);
  const [dueDate, setDueDate] = useState<string>(initialDueDate ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = initialTitle.length > 0;

  async function handleSave(e?: React.FormEvent) {
    e?.preventDefault();
    if (!title.trim()) {
      setError("Give the task a title.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await onSave({ title: title.trim(), priority, dueDate: dueDate || null });
      if (!isEditMode) {
        setTitle("");
        setPriority("MEDIUM");
        setDueDate("");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong saving that.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-3">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="What needs doing?"
        autoFocus={!isEditMode}
      />
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          {PRIORITIES.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPriority(p.value)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs transition-colors",
                priority === p.value
                  ? "border-primary bg-muted text-foreground"
                  : "border-border text-muted-foreground hover:bg-muted"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
        <Input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="h-8 w-auto text-xs"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : saveLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
