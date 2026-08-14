"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export function GoalComposer({
  initialTitle = "",
  initialDescription = "",
  initialTargetDate = null,
  onSave,
  onCancel,
  saveLabel = "Add goal",
}: {
  initialTitle?: string;
  initialDescription?: string;
  initialTargetDate?: string | null;
  onSave: (data: {
    title: string;
    description: string;
    targetDate: string | null;
  }) => Promise<void>;
  onCancel?: () => void;
  saveLabel?: string;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [targetDate, setTargetDate] = useState(initialTargetDate ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = initialTitle.length > 0;

  async function handleSave(e?: React.FormEvent) {
    e?.preventDefault();
    if (!title.trim()) {
      setError("Give the goal a title.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        description: description.trim(),
        targetDate: targetDate || null,
      });
      if (!isEditMode) {
        setTitle("");
        setDescription("");
        setTargetDate("");
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
        placeholder="What are you working toward?"
        autoFocus={!isEditMode}
      />
      <Textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Why this matters (optional)"
        rows={2}
      />
      <div className="flex items-center gap-2">
        <label className="text-xs text-muted-foreground">Target date</label>
        <Input
          type="date"
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
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
