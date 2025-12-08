import {
  HabitHistoryEntry,
  HabitRow,
  HabitViewSettings,
  HabitWorkbookData,
} from "@/lib/habits/types";
import { ensureHabitViewSettings } from "@/lib/habits/workbook";

export type AddHabitInput = {
  name: string;
  icon?: string;
  description?: string;
  category?: string;
  period?: string;
};

export function addHabit(workbook: HabitWorkbookData, input: AddHabitInput) {
  const timestamp = new Date().toISOString();
  const habitId = generateHabitId(input.name, new Set(workbook.habits.map((habit) => habit.id)));

  const newHabit: HabitRow = {
    id: habitId,
    icon: input.icon ?? "✅",
    name: input.name,
    description: input.description ?? "",
    createdAt: timestamp,
    category: input.category ?? "General",
    period: input.period ?? "day",
    deprecatedAt: null,
  };

  const habits = [...workbook.habits, newHabit];
  const view: HabitViewSettings[] = [
    ...workbook.view,
    {
      habitId,
      order: workbook.view.length,
      hidden: false,
      color: null,
    },
  ];

  return {
    workbook: {
      ...workbook,
      habits,
      view: normalizeView(habits, view),
    },
    habit: newHabit,
  };
}

export type RecordHistoryInput = {
  habitId: string;
  datetime: string;
  status?: string;
  comment?: string;
};

export function recordHabitEvent(
  workbook: HabitWorkbookData,
  input: RecordHistoryInput,
) {
  const newEntry: HabitHistoryEntry = {
    habitId: input.habitId,
    datetime: input.datetime,
    status: input.status ?? "OK",
    comment: input.comment ?? "",
  };

  return {
    ...workbook,
    history: [...workbook.history, newEntry],
  };
}

export function toggleHabitEvent(
  workbook: HabitWorkbookData,
  input: RecordHistoryInput,
) {
  const existsIndex = workbook.history.findIndex(
    (entry) => entry.habitId === input.habitId && entry.datetime === input.datetime,
  );

  if (existsIndex >= 0) {
    const history = workbook.history.filter((_, index) => index !== existsIndex);
    return { ...workbook, history };
  }

  return recordHabitEvent(workbook, input);
}

export function reorderHabit(
  workbook: HabitWorkbookData,
  habitId: string,
  direction: "up" | "down",
) {
  const sorted = [...normalizeView(workbook.habits, workbook.view)];
  const index = sorted.findIndex((entry) => entry.habitId === habitId);
  if (index === -1) {
    return workbook;
  }

  const delta = direction === "up" ? -1 : 1;
  const targetIndex = Math.max(0, Math.min(sorted.length - 1, index + delta));
  if (targetIndex === index) {
    return workbook;
  }

  const updated = [...sorted];
  const [moved] = updated.splice(index, 1);
  updated.splice(targetIndex, 0, moved);

  return {
    ...workbook,
    view: updated.map((entry, idx) => ({ ...entry, order: idx })),
  };
}

export function setHabitHidden(
  workbook: HabitWorkbookData,
  habitId: string,
  hidden: boolean,
) {
  const view = normalizeView(workbook.habits, workbook.view).map((entry) =>
    entry.habitId === habitId ? { ...entry, hidden } : entry,
  );

  return {
    ...workbook,
    view,
  };
}

export function removeHabitFromView(
  workbook: HabitWorkbookData,
  habitId: string,
) {
  const timestamp = new Date().toISOString();
  const habits = workbook.habits.map((habit) =>
    habit.id === habitId ? { ...habit, deprecatedAt: timestamp } : habit,
  );

  const view = normalizeView(habits, workbook.view).map((entry) =>
    entry.habitId === habitId ? { ...entry, hidden: true } : entry,
  );

  return {
    ...workbook,
    habits,
    view,
  };
}

export function restoreHabit(
  workbook: HabitWorkbookData,
  habitId: string,
) {
  const habits = workbook.habits.map((habit) =>
    habit.id === habitId ? { ...habit, deprecatedAt: null } : habit,
  );

  const view = normalizeView(habits, workbook.view).map((entry) =>
    entry.habitId === habitId ? { ...entry, hidden: false } : entry,
  );

  return {
    ...workbook,
    habits,
    view,
  };
}

function normalizeView(habits: HabitRow[], view: HabitViewSettings[]) {
  const normalized = ensureHabitViewSettings(habits, view);
  return normalized.map((entry, index) => ({ ...entry, order: index }));
}

function generateHabitId(name: string, existing: Set<string>) {
  const base = slugify(name) || "habit";
  if (!existing.has(base)) {
    return base;
  }

  let suffix = 1;
  let candidate = `${base}-${suffix}`;
  while (existing.has(candidate)) {
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
  return candidate;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .trim();
}
