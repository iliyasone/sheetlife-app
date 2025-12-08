export type HabitRow = {
  id: string;
  icon: string;
  name: string;
  description: string;
  createdAt: string;
  category: string;
  period: string;
  deprecatedAt: string | null;
};

export type HabitHistoryEntry = {
  datetime: string;
  habitId: string;
  status: string;
  comment: string;
};

export type HabitViewSettings = {
  habitId: string;
  order: number;
  hidden: boolean;
  color?: string | null;
};

export type HabitWorkbookData = {
  habits: HabitRow[];
  history: HabitHistoryEntry[];
  view: HabitViewSettings[];
};
