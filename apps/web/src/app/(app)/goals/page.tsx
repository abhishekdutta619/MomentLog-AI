"use client";

import { useEffect, useState, useCallback } from "react";
import { GoalComposer } from "@/components/goals/goal-composer";
import { GoalCard } from "@/components/goals/goal-card";
import type { Goal } from "@/types/goal";

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/goals");
      if (!res.ok) throw new Error("Couldn't load your goals.");
      const data = await res.json();
      setGoals(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(data: {
    title: string;
    description: string;
    targetDate: string | null;
  }) {
    const res = await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(
        typeof body?.error === "string" ? body.error : "Couldn't create that goal."
      );
    }
    const created: Goal = await res.json();
    setGoals((prev) => [created, ...prev]);
  }

  async function handleUpdate(
    id: string,
    data: { title: string; description: string; targetDate: string | null }
  ) {
    const res = await fetch(`/api/goals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(
        typeof body?.error === "string" ? body.error : "Couldn't update that goal."
      );
    }
    const updated: Goal = await res.json();
    setGoals((prev) => prev.map((g) => (g.id === id ? updated : g)));
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/goals/${id}`, { method: "DELETE" });
    if (res.ok) {
      setGoals((prev) => prev.filter((g) => g.id !== id));
    }
  }

  async function handleAddMilestone(goalId: string, title: string) {
    const res = await fetch(`/api/goals/${goalId}/milestones`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    if (!res.ok) return;
    const milestone = await res.json();
    setGoals((prev) =>
      prev.map((g) =>
        g.id === goalId ? { ...g, milestones: [...g.milestones, milestone] } : g
      )
    );
  }

  async function handleToggleMilestone(goalId: string, milestoneId: string, completed: boolean) {
    const res = await fetch(`/api/goals/${goalId}/milestones/${milestoneId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed }),
    });
    if (!res.ok) return;
    const updated = await res.json();
    setGoals((prev) =>
      prev.map((g) =>
        g.id === goalId
          ? {
              ...g,
              milestones: g.milestones.map((m) => (m.id === milestoneId ? updated : m)),
            }
          : g
      )
    );
  }

  async function handleDeleteMilestone(goalId: string, milestoneId: string) {
    const res = await fetch(`/api/goals/${goalId}/milestones/${milestoneId}`, {
      method: "DELETE",
    });
    if (!res.ok) return;
    setGoals((prev) =>
      prev.map((g) =>
        g.id === goalId
          ? { ...g, milestones: g.milestones.filter((m) => m.id !== milestoneId) }
          : g
      )
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-semibold text-foreground">Goals</h1>

      <div className="mb-8 border-b border-border pb-8">
        <GoalComposer onSave={handleCreate} saveLabel="Add goal" />
      </div>

      {loading && <p className="text-sm text-muted-foreground">Loading your goals...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && goals.length === 0 && !error && (
        <p className="text-sm text-muted-foreground">No goals yet. Add your first one above.</p>
      )}

      <div>
        {goals.map((goal) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            onAddMilestone={handleAddMilestone}
            onToggleMilestone={handleToggleMilestone}
            onDeleteMilestone={handleDeleteMilestone}
          />
        ))}
      </div>
    </div>
  );
}
