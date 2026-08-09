"use client";

import { useState, useEffect } from "react";
import { MomentComposer } from "./moment-composer";
import type { Moment } from "@/types/moment";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function MomentCard({
  moment,
  allTags,
  onUpdate,
  onDelete,
}: {
  moment: Moment;
  allTags: string[];
  onUpdate: (id: string, data: { content: string; tags: string[] }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Auto-reset the delete confirmation after a few seconds rather than
  // relying on onBlur — blur timing relative to a sibling button's click
  // event is inconsistent enough across browsers that it can eat the
  // actual confirm click. A timeout is simpler and reliable.
  useEffect(() => {
    if (!confirmingDelete) return;
    const timer = setTimeout(() => setConfirmingDelete(false), 4000);
    return () => clearTimeout(timer);
  }, [confirmingDelete]);

  if (editing) {
    return (
      <div className="border-b border-border py-6">
        <MomentComposer
          initialContent={moment.content}
          initialTags={moment.tags.map((t) => t.name)}
          allTags={allTags}
          saveLabel="Save changes"
          onCancel={() => setEditing(false)}
          onSave={async (data) => {
            await onUpdate(moment.id, data);
            setEditing(false);
          }}
        />
      </div>
    );
  }

  return (
    <div className="border-b border-border py-6">
      <p className="mb-2 text-xs text-muted-foreground">{formatDate(moment.createdAt)}</p>

      {/* Plain text, not rendered markdown — content is stored as markdown
          for future AI processing, but a WYSIWYG/rendered view is a later
          polish pass, not core to Phase 1. whitespace-pre-wrap preserves
          line breaks without needing a markdown-rendering dependency. */}
      <p className="whitespace-pre-wrap text-sm text-foreground">{moment.content}</p>

      {moment.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {moment.tags.map((tag) => (
            <span
              key={tag.id}
              className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground"
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
        <button onClick={() => setEditing(true)} className="hover:text-foreground hover:underline">
          Edit
        </button>
        {confirmingDelete ? (
          <button
            onClick={async () => {
              setDeleting(true);
              await onDelete(moment.id);
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
