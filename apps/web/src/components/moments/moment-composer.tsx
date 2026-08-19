"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { TagInput } from "./tag-input";
import { MoodPicker } from "./mood-picker";

// Wrapped in a Promise that always resolves (never rejects) — geolocation
// being denied, unavailable, or timing out are all just "no weather this
// time," never an error that should interrupt saving a Moment. A 5s
// timeout keeps a slow/stalled location fix from blocking the save
// indefinitely; maximumAge lets the browser reuse a recent fix instead of
// re-prompting for every single Moment in a session.
function getCurrentCoords(): Promise<{ latitude: number; longitude: number } | null> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => resolve(null),
      { timeout: 5000, maximumAge: 10 * 60 * 1000 }
    );
  });
}

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
    latitude?: number;
    longitude?: number;
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
      // Only requested for new Moments — weather reflects when something
      // was originally written, not when it was edited, so an edit never
      // re-fetches or re-prompts for location.
      const coords = isEditMode ? null : await getCurrentCoords();

      await onSave({
        content: content.trim(),
        tags,
        moodScore,
        ...(coords ? { latitude: coords.latitude, longitude: coords.longitude } : {}),
      });

      if (!isEditMode) {
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
