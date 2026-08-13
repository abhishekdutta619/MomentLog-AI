"use client";

import { useEffect, useState, useCallback } from "react";
import { TaskComposer } from "@/components/tasks/task-composer";
import { TaskItem } from "@/components/tasks/task-item";
import type { Task, TaskPriority } from "@/types/task";

// Mirrors the server's ORDER BY (completed asc, dueDate asc nulls last,
// createdAt desc) so client-side state updates after create/update/toggle
// stay correctly ordered without a full refetch on every action.
function sortTasks(a: Task, b: Task) {
  if (a.completed !== b.completed) return a.completed ? 1 : -1;
  if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
  if (a.dueDate) return -1;
  if (b.dueDate) return 1;
  return b.createdAt.localeCompare(a.createdAt);
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/tasks");
      if (!res.ok) throw new Error("Couldn't load your tasks.");
      const data = await res.json();
      setTasks(data);
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
    priority: TaskPriority;
    dueDate: string | null;
  }) {
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(
        typeof body?.error === "string" ? body.error : "Couldn't create that task."
      );
    }
    const created: Task = await res.json();
    setTasks((prev) => [...prev, created].sort(sortTasks));
  }

  async function handleUpdate(
    id: string,
    data: Partial<{
      title: string;
      priority: TaskPriority;
      dueDate: string | null;
      completed: boolean;
    }>
  ) {
    const res = await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(
        typeof body?.error === "string" ? body.error : "Couldn't update that task."
      );
    }
    const updated: Task = await res.json();
    setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)).sort(sortTasks));
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    if (res.ok) {
      setTasks((prev) => prev.filter((t) => t.id !== id));
    }
  }

  const visibleTasks = showCompleted ? tasks : tasks.filter((t) => !t.completed);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-semibold text-foreground">Tasks</h1>

      <div className="mb-8 border-b border-border pb-8">
        <TaskComposer onSave={handleCreate} saveLabel="Add task" />
      </div>

      {loading && <p className="text-sm text-muted-foreground">Loading your tasks...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && tasks.length === 0 && !error && (
        <p className="text-sm text-muted-foreground">No tasks yet. Add your first one above.</p>
      )}

      {!loading && tasks.length > 0 && (
        <div className="mb-2 flex justify-end">
          <button
            onClick={() => setShowCompleted((s) => !s)}
            className="text-xs text-muted-foreground hover:text-foreground hover:underline"
          >
            {showCompleted ? "Hide completed" : "Show completed"}
          </button>
        </div>
      )}

      <div>
        {visibleTasks.map((task) => (
          <TaskItem key={task.id} task={task} onUpdate={handleUpdate} onDelete={handleDelete} />
        ))}
      </div>
    </div>
  );
}
