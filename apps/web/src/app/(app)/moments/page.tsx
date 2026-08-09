"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { MomentComposer } from "@/components/moments/moment-composer";
import { MomentCard } from "@/components/moments/moment-card";
import { Button } from "@/components/ui/button";
import type { Moment, Tag } from "@/types/moment";

// Next.js requires useSearchParams() to sit inside a Suspense boundary or
// the build opts the whole page out of static rendering with a warning
// (and in some configurations, an error). Splitting the searchParams-
// dependent logic into its own component keeps that boundary tight around
// just the part that needs it.
function MomentsContent() {
  const searchParams = useSearchParams();
  const dateFilter = searchParams.get("date"); // "YYYY-MM-DD" | null

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
      const query = new URLSearchParams();
      if (dateFilter) {
        // Same UTC-day convention as the calendar route from Part 3/5 —
        // the whole day, midnight to midnight UTC.
        query.set("from", `${dateFilter}T00:00:00.000Z`);
        query.set("to", `${dateFilter}T23:59:59.999Z`);
      }
      const momentsUrl = query.toString() ? `/api/moments?${query}` : "/api/moments";

      const [momentsRes, tagsRes] = await Promise.all([
        fetch(momentsUrl),
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
  }, [dateFilter]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  async function loadMore() {
    if (!nextCursor) return;
    setLoadingMore(true);
    try {
      const query = new URLSearchParams({ cursor: nextCursor });
      if (dateFilter) {
        query.set("from", `${dateFilter}T00:00:00.000Z`);
        query.set("to", `${dateFilter}T23:59:59.999Z`);
      }
      const res = await fetch(`/api/moments?${query}`);
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
    // Only prepend into the visible list if it actually belongs in the
    // current view — e.g. don't show a freshly-created Moment at the top
    // of a filtered "just this day" view if it wasn't written for that day.
    if (!dateFilter || created.createdAt.slice(0, 10) === dateFilter) {
      setMoments((prev) => [created, ...prev]);
    }
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
      <h1 className="mb-2 text-2xl font-semibold text-foreground">Moments</h1>

      {dateFilter ? (
        <p className="mb-6 text-sm text-muted-foreground">
          Showing Moments from{" "}
          {new Date(`${dateFilter}T00:00:00.000Z`).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
            timeZone: "UTC",
          })}{" "}
          —{" "}
          <Link href="/moments" className="underline hover:text-foreground">
            View all
          </Link>
        </p>
      ) : (
        <div className="mb-6" />
      )}

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
          {dateFilter
            ? "Nothing written on this day."
            : "Nothing here yet. Write your first Moment above."}
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

export default function MomentsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading...</p>}>
      <MomentsContent />
    </Suspense>
  );
}
