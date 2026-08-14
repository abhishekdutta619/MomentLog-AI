export interface Milestone {
  id: string;
  goalId: string;
  title: string;
  completed: boolean;
  completedAt: string | null;
  order: number;
}

export interface Goal {
  id: string;
  title: string;
  description: string | null;
  targetDate: string | null;
  milestones: Milestone[];
  createdAt: string;
  updatedAt: string;
}
