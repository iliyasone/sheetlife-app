"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocalFileRecord, useLocalFileSystem } from "@/components/local-files-provider";
import { HABIT_VIEW_TYPE, HABITS_FILE_NAME, HABITS_MIME_TYPE } from "@/lib/habits/constants";
import {
  AddHabitInput,
  addHabit,
  removeHabitFromView,
  reorderHabit,
  restoreHabit,
  setHabitHidden,
  toggleHabitEvent,
} from "@/lib/habits/actions";
import {
  createEmptyHabitWorkbook,
  parseHabitWorkbook,
  writeHabitWorkbook,
} from "@/lib/habits/workbook";
import {
  HabitHistoryEntry,
  HabitRow,
  HabitViewSettings,
  HabitWorkbookData,
} from "@/lib/habits/types";
import { LocalFileRecord } from "@/lib/local-files/types";

type HabitViewProps = {
  fileId: string;
};

export function HabitView({ fileId }: HabitViewProps) {
  const { ready, saveFileRecord } = useLocalFileSystem();
  const record = useLocalFileRecord(fileId);
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));

  const workbookRef = useRef<HabitWorkbookData>(createEmptyHabitWorkbook());
  const workbook = useMemo(
    () =>
      record?.contentBase64
        ? parseHabitWorkbook(record.contentBase64)
        : createEmptyHabitWorkbook(),
    [record],
  );
  useEffect(() => {
    workbookRef.current = workbook;
  }, [workbook]);

  const persistWorkbook = useCallback(
    (next: HabitWorkbookData) => {
      const contentBase64 = writeHabitWorkbook(next);
      const now = new Date().toISOString();
      const payload: LocalFileRecord = {
        id: fileId,
        name: HABITS_FILE_NAME,
        viewType: HABIT_VIEW_TYPE,
        mimeType: HABITS_MIME_TYPE,
        createdAt: record?.createdAt ?? now,
        updatedAt: now,
        contentBase64,
      };
      saveFileRecord(payload);
    },
    [fileId, record?.createdAt, saveFileRecord],
  );

  const updateWorkbook = useCallback(
    (updater: (prev: HabitWorkbookData) => HabitWorkbookData) => {
      const next = updater(workbookRef.current);
      workbookRef.current = next;
      persistWorkbook(next);
    },
    [persistWorkbook],
  );

  const habitsMap = useMemo(() => new Map(workbook.habits.map((habit) => [habit.id, habit])), [workbook.habits]);
  const orderedHabits = useMemo(() => {
    const pairs = workbook.view
      .map((viewEntry) => {
        const habit = habitsMap.get(viewEntry.habitId);
        if (!habit) {
          return null;
        }
        return { habit, view: viewEntry };
      })
      .filter(Boolean) as HabitWithView[];
    return pairs.sort((a, b) => a.view.order - b.view.order);
  }, [habitsMap, workbook.view]);

  const visibleHabits = orderedHabits.filter(
    ({ habit, view }) => !view.hidden && !habit.deprecatedAt,
  );
  const hiddenHabits = orderedHabits.filter(({ view }) => view.hidden);

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)),
    [weekStart],
  );

  const historyLookup = useMemo(() => buildHistoryLookup(workbook.history), [workbook.history]);

  const handleAddHabit = useCallback(
    (input: AddHabitInput) => {
      updateWorkbook((prev) => addHabit(prev, input).workbook);
    },
    [updateWorkbook],
  );

  const handleToggleCell = useCallback(
    (habitId: string, date: Date) => {
      const datetime = toIsoDate(date);
      updateWorkbook((prev) => toggleHabitEvent(prev, { habitId, datetime }));
    },
    [updateWorkbook],
  );

  const handleReorder = useCallback(
    (habitId: string, direction: "up" | "down") => {
      updateWorkbook((prev) => reorderHabit(prev, habitId, direction));
    },
    [updateWorkbook],
  );

  const handleHide = useCallback(
    (habitId: string, hidden: boolean) => {
      updateWorkbook((prev) => setHabitHidden(prev, habitId, hidden));
    },
    [updateWorkbook],
  );

  const handleRemove = useCallback(
    (habitId: string) => {
      updateWorkbook((prev) => removeHabitFromView(prev, habitId));
    },
    [updateWorkbook],
  );

  const handleRestore = useCallback(
    (habitId: string) => {
      updateWorkbook((prev) => restoreHabit(prev, habitId));
    },
    [updateWorkbook],
  );

  if (!ready) {
    return <p className="text-sm text-zinc-500">Loading local workspace…</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 lg:grid-cols-[2fr_minmax(0,1fr)]">
        <WeekNavigator
          currentWeekStart={weekStart}
          onChange={(next) => setWeekStart(next)}
        />
        <AddHabitCard onAdd={handleAddHabit} />
      </div>

      {visibleHabits.length === 0 ? (
        <EmptyState onAdd={handleAddHabit} />
      ) : (
        <div className="overflow-hidden rounded border border-zinc-200">
          <div className="overflow-x-auto">
            <table className="min-w-full table-fixed divide-y divide-zinc-200">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="w-64 px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Habit
                  </th>
                  {weekDays.map((date) => (
                    <th
                      key={date.toISOString()}
                      className="px-2 py-3 text-center text-xs font-semibold uppercase tracking-wide text-zinc-500"
                    >
                      <div>{formatWeekday(date)}</div>
                      <div className="font-normal text-zinc-400">{formatShortDate(date)}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 bg-white">
                {visibleHabits.map(({ habit, view }) => (
                  <tr key={habit.id}>
                    <td className="px-4 py-3 align-top">
                      <HabitMeta
                        habit={habit}
                        view={view}
                        onReorder={handleReorder}
                        onHide={handleHide}
                        onRemove={handleRemove}
                      />
                    </td>
                    {weekDays.map((date) => {
                      const dateKey = formatKey(date);
                      const entry = historyLookup.get(habit.id)?.get(dateKey) ?? null;
                      return (
                        <td key={`${habit.id}-${dateKey}`} className="px-2 py-2 text-center">
                          <HabitCell
                            active={Boolean(entry)}
                            onToggle={() => handleToggleCell(habit.id, date)}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {hiddenHabits.length > 0 && (
        <HiddenHabitsPanel habits={hiddenHabits} onRestore={handleRestore} />
      )}
    </div>
  );
}

function HabitMeta({
  habit,
  view,
  onReorder,
  onHide,
  onRemove,
}: {
  habit: HabitRow;
  view: HabitViewSettings;
  onReorder: (habitId: string, direction: "up" | "down") => void;
  onHide: (habitId: string, hidden: boolean) => void;
  onRemove: (habitId: string) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{habit.icon || "•"}</span>
        <div>
          <p className="text-sm font-semibold text-zinc-900">{habit.name || habit.id}</p>
          {habit.description && (
            <p className="text-xs text-zinc-500">{habit.description}</p>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-2 text-xs">
        <button
          type="button"
          className="rounded border border-zinc-200 px-2 py-1 text-zinc-600 hover:bg-zinc-50"
          onClick={() => onReorder(habit.id, "up")}
        >
          Move up
        </button>
        <button
          type="button"
          className="rounded border border-zinc-200 px-2 py-1 text-zinc-600 hover:bg-zinc-50"
          onClick={() => onReorder(habit.id, "down")}
        >
          Move down
        </button>
        <button
          type="button"
          className="rounded border border-zinc-200 px-2 py-1 text-zinc-600 hover:bg-zinc-50"
          onClick={() => onHide(habit.id, !view.hidden)}
        >
          {view.hidden ? "Show" : "Hide"}
        </button>
        <button
          type="button"
          className="rounded border border-red-200 px-2 py-1 text-red-600 hover:bg-red-50"
          onClick={() => onRemove(habit.id)}
        >
          Remove from view
        </button>
      </div>
    </div>
  );
}

function HabitCell({ active, onToggle }: { active: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex h-12 w-full items-center justify-center rounded border text-lg font-semibold transition ${
        active
          ? "border-emerald-300 bg-emerald-50 text-emerald-700"
          : "border-zinc-200 bg-white text-zinc-400 hover:bg-zinc-50"
      }`}
    >
      {active ? "✓" : ""}
    </button>
  );
}

function WeekNavigator({
  currentWeekStart,
  onChange,
}: {
  currentWeekStart: Date;
  onChange: (date: Date) => void;
}) {
  const goToWeek = (offset: number) => {
    onChange(addDays(currentWeekStart, offset * 7));
  };

  return (
    <div className="rounded border border-zinc-200 bg-white/80 p-4">
      <p className="text-xs uppercase tracking-wide text-zinc-500">Week</p>
      <p className="text-lg font-semibold text-zinc-900">
        {formatDateRange(currentWeekStart)}
      </p>
      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          className="rounded border border-zinc-200 px-3 py-1 text-sm text-zinc-700 hover:bg-zinc-50"
          onClick={() => goToWeek(-1)}
        >
          Previous
        </button>
        <button
          type="button"
          className="rounded border border-zinc-200 px-3 py-1 text-sm text-zinc-700 hover:bg-zinc-50"
          onClick={() => goToWeek(1)}
        >
          Next
        </button>
        <button
          type="button"
          className="rounded border border-emerald-200 px-3 py-1 text-sm text-emerald-700 hover:bg-emerald-50"
          onClick={() => onChange(getWeekStart(new Date()))}
        >
          Today
        </button>
      </div>
    </div>
  );
}

function AddHabitCard({ onAdd }: { onAdd: (input: AddHabitInput) => void }) {
  const [formState, setFormState] = useState({
    name: "",
    icon: "✅",
    description: "",
    category: "General",
    period: "day",
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!formState.name.trim()) {
      setError("Name is required.");
      return;
    }
    setError(null);
    onAdd(formState);
    setFormState((prev) => ({ ...prev, name: "", description: "" }));
  };

  return (
    <form
      className="rounded border border-zinc-200 bg-white/80 p-4"
      onSubmit={handleSubmit}
    >
      <p className="text-xs uppercase tracking-wide text-zinc-500">Add Habit</p>
      <div className="mt-3 grid gap-3 text-sm">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-zinc-600">Name</span>
          <input
            type="text"
            value={formState.name}
            onChange={(event) => setFormState({ ...formState, name: event.target.value })}
            className="rounded border border-zinc-300 px-2 py-1.5"
            placeholder="Daily stretch"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-zinc-600">Icon</span>
          <input
            type="text"
            value={formState.icon}
            onChange={(event) => setFormState({ ...formState, icon: event.target.value })}
            className="rounded border border-zinc-300 px-2 py-1.5"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-zinc-600">Description</span>
          <textarea
            value={formState.description}
            onChange={(event) =>
              setFormState({
                ...formState,
                description: event.target.value,
              })
            }
            className="rounded border border-zinc-300 px-2 py-1.5"
            rows={2}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-zinc-600">Category</span>
          <input
            type="text"
            value={formState.category}
            onChange={(event) =>
              setFormState({
                ...formState,
                category: event.target.value,
              })
            }
            className="rounded border border-zinc-300 px-2 py-1.5"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-zinc-600">Period</span>
          <select
            value={formState.period}
            onChange={(event) =>
              setFormState({
                ...formState,
                period: event.target.value,
              })
            }
            className="rounded border border-zinc-300 px-2 py-1.5"
          >
            <option value="day">Daily</option>
            <option value="week">Weekly</option>
            <option value="month">Monthly</option>
          </select>
        </label>
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      <button
        type="submit"
        className="mt-4 w-full rounded bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500"
      >
        Add habit
      </button>
    </form>
  );
}

function EmptyState({ onAdd }: { onAdd: (input: AddHabitInput) => void }) {
  return (
    <div className="rounded border border-dashed border-emerald-200 bg-emerald-50/60 px-6 py-10 text-center text-sm text-emerald-800">
      <p className="text-base font-medium text-emerald-900">No habits yet</p>
      <p className="mt-1 text-sm">
        Use the Add Habit panel to create your first `habits.xlsx` file locally. All data lives in
        your browser storage.
      </p>
      <button
        type="button"
        className="mt-4 rounded border border-emerald-300 px-3 py-1.5 text-sm font-medium text-emerald-800 hover:bg-emerald-100"
        onClick={() => onAdd({ name: "New habit" })}
      >
        Quick create habit
      </button>
    </div>
  );
}

function HiddenHabitsPanel({
  habits,
  onRestore,
}: {
  habits: HabitWithView[];
  onRestore: (habitId: string) => void;
}) {
  return (
    <div className="rounded border border-zinc-200 bg-white/80 p-4">
      <p className="text-xs uppercase tracking-wide text-zinc-500">Hidden habits</p>
      <div className="mt-3 flex flex-wrap gap-3 text-sm">
        {habits.map(({ habit }) => (
          <div
            key={habit.id}
            className="flex items-center gap-2 rounded border border-zinc-200 px-3 py-1.5"
          >
            <span>{habit.icon || "•"}</span>
            <span className="text-zinc-700">{habit.name}</span>
            <button
              type="button"
              className="text-xs font-medium text-emerald-700"
              onClick={() => onRestore(habit.id)}
            >
              Restore
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

type HabitWithView = {
  habit: HabitRow;
  view: HabitViewSettings;
};

function buildHistoryLookup(history: HabitHistoryEntry[]) {
  const map = new Map<string, Map<string, HabitHistoryEntry>>();
  history.forEach((entry) => {
    const dateKey = entry.datetime.slice(0, 10);
    if (!map.has(entry.habitId)) {
      map.set(entry.habitId, new Map());
    }
    map.get(entry.habitId)!.set(dateKey, entry);
  });
  return map;
}

function getWeekStart(date: Date) {
  const day = date.getDay();
  const diff = (day + 6) % 7; // Monday start
  const result = new Date(date);
  result.setDate(date.getDate() - diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

function addDays(date: Date, offset: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + offset);
  return result;
}

function formatWeekday(date: Date) {
  return date.toLocaleDateString(undefined, { weekday: "short" });
}

function formatShortDate(date: Date) {
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatDateRange(start: Date) {
  const end = addDays(start, 6);
  const formatter = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  });
  return `${formatter.format(start)} - ${formatter.format(end)}`;
}

function toIsoDate(date: Date) {
  const utc = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  return new Date(utc).toISOString();
}

function formatKey(date: Date) {
  return toIsoDate(date).slice(0, 10);
}
