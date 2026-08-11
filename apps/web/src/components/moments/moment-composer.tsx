"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { TagInput } from "./tag-input";
import { MoodPicker } from "./mood-picker";

export function MomentComposer({
  initialContent = "",
  initialTags = [],
  initialMood = null,
  allTags,
  onSave,
  onCancel,
  saveLabel = "Save",
  autoFocus = false,
}: {
  initialContent?: string;
  initialTags?: string[];
  initialMood?: number | null;
  allTags: string[];
  onSave: (data: {
    content: string;
    tags: string[];
    moodScore: number | null;
  }) => Promise<void>;
  onCancel?: () => void;
  saveLabel?: string;
  autoFocus?: boolean;
}) {
  const [content, setContent] = useState(initialContent);
  const [tags, setTags] = useState<string[]>(initialTags);
  const [moodScore, setMoodScore] = useState<number | null>(initialMood);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = initialContent.length > 0;

  async function handleSave() {
    if (!content.trim()) {
      setError("Write something before saving.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await onSave({ content: content.trim(), tags, moodScore });
      if (!isEditMode) {
        // Fresh composer (create mode) — clear it after a successful save
        // so it's ready for the next entry. Edit mode leaves the fields
        // as-is since the parent unmounts this back into a card afterward.
        setContent("");
        setTags([]);
        setMoodScore(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong saving that.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <MoodPicker value={moodScore} onChange={setMoodScore} />
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What happened today?"
        rows={isEditMode ? 4 : 3}
        autoFocus={autoFocus}
      />
      <TagInput tags={tags} onChange={setTags} suggestions={allTags} />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center gap-2">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : saveLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}
