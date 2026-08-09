"use client";

import { useEffect, useState, useCallback } from "react";
import { MomentComposer } from "@/components/moments/moment-composer";
import { MomentCard } from "@/components/moments/moment-card";
import { Button } from "@/components/ui/button";
import type { Moment, Tag } from "@/types/moment";

export default function MomentsPage() {
  const [moments, setMoments] = useState<Moment[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [momentsRes, tagsRes] = await Promise.all([
        fetch("/api/moments"),
        fetch("/api/tags"),
      ]);
      if (!momentsRes.ok) throw new Error("Couldn't load your Moments.");

      const momentsData = await momentsRes.json();
      const tagsData: Tag[] = tagsRes.ok ? await tagsRes.json() : [];

      setMoments(momentsData.moments);
      setNextCursor(momentsData.nextCursor);
      setAllTags(tagsData.map((t) => t.name));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  async function loadMore() {
    if (!nextCursor) return;
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/moments?cursor=${nextCursor}`);
      if (!res.ok) throw new Error("Couldn't load more Moments.");
      const data = await res.json();
      setMoments((prev) => [...prev, ...data.moments]);
      setNextCursor(data.nextCursor);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoadingMore(false);
    }
  }

  async function handleCreate(data: { content: string; tags: string[] }) {
    const res = await fetch("/api/moments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(
        typeof body?.error === "string" ? body.error : "Couldn't save that Moment."
      );
    }
    const created: Moment = await res.json();
    setMoments((prev) => [created, ...prev]);
    setAllTags((prev) => Array.from(new Set([...prev, ...data.tags])));
  }

  async function handleUpdate(id: string, data: { content: string; tags: string[] }) {
    const res = await fetch(`/api/moments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(
        typeof body?.error === "string" ? body.error : "Couldn't update that Moment."
      );
    }
    const updated: Moment = await res.json();
    setMoments((prev) => prev.map((m) => (m.id === id ? updated : m)));
    setAllTags((prev) => Array.from(new Set([...prev, ...data.tags])));
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/moments/${id}`, { method: "DELETE" });
    if (res.ok) {
      setMoments((prev) => prev.filter((m) => m.id !== id));
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-semibold text-foreground">Moments</h1>

      <div className="mb-8 border-b border-border pb-8">
        <MomentComposer
          allTags={allTags}
          onSave={handleCreate}
          saveLabel="Save Moment"
          autoFocus
        />
      </div>

      {loading && <p className="text-sm text-muted-foreground">Loading your Moments...</p>}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && moments.length === 0 && !error && (
        <p className="text-sm text-muted-foreground">
          Nothing here yet. Write your first Moment above.
        </p>
      )}

      <div>
        {moments.map((moment) => (
          <MomentCard
            key={moment.id}
            moment={moment}
            allTags={allTags}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {nextCursor && (
        <div className="mt-6 flex justify-center">
          <Button variant="ghost" onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? "Loading..." : "Load more"}
          </Button>
        </div>
      )}
    </div>
  );
}
