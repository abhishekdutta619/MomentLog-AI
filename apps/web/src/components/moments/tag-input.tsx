"use client";

import { useState, useRef } from "react";
import { X } from "lucide-react";

export function TagInput({
  tags,
  onChange,
  suggestions = [],
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
}) {
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function addTag(raw: string) {
    // Lowercased client-side too, matching the server — keeps the
    // suggestion dropdown and the "already added" check consistent with
    // what will actually get stored.
    const name = raw.trim().toLowerCase();
    if (!name || tags.includes(name) || tags.length >= 10) return;
    onChange([...tags, name]);
    setDraft("");
  }

  function removeTag(name: string) {
    onChange(tags.filter((t) => t !== name));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(draft);
    } else if (e.key === "Backspace" && draft === "" && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  }

  const filteredSuggestions = suggestions.filter(
    (s) => draft.length > 0 && s.startsWith(draft.toLowerCase()) && !tags.includes(s)
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      {tags.map((tag) => (
        <span
          key={tag}
          className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground"
        >
          {tag}
          <button
            type="button"
            onClick={() => removeTag(tag)}
            aria-label={`Remove tag ${tag}`}
            className="hover:text-foreground"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}

      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? "Add tags..." : ""}
          className="h-7 min-w-[100px] border-none bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
        {filteredSuggestions.length > 0 && (
          <div className="absolute left-0 top-full z-10 mt-1 w-40 rounded-md border border-border bg-background py-1 shadow-sm">
            {filteredSuggestions.slice(0, 5).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => addTag(s)}
                className="block w-full px-3 py-1.5 text-left text-xs text-foreground hover:bg-muted"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
