export interface Tag {
  id: string;
  name: string;
}

export interface Moment {
  id: string;
  content: string;
  tags: Tag[];
  moodScore: number | null;
  weatherTempC: number | null;
  weatherCondition: string | null;
  aiSummary: string | null;
  createdAt: string;
  updatedAt: string;
}
