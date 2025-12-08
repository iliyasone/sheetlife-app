import * as XLSX from "xlsx";
import { HabitHistoryEntry, HabitRow, HabitViewSettings, HabitWorkbookData } from "@/lib/habits/types";

const HABITS_SHEET_NAME = "habits";
const HISTORY_SHEET_NAME = "history";
const VIEW_SHEET_NAME = "view";

export function createEmptyHabitWorkbook(): HabitWorkbookData {
  return {
    habits: [],
    history: [],
    view: [],
  };
}

export function parseHabitWorkbook(contentBase64: string): HabitWorkbookData {
  const workbook = XLSX.read(contentBase64, { type: "base64" });

  const habits = readHabitsSheet(workbook);
  const history = readHistorySheet(workbook);
  const view = ensureHabitViewSettings(habits, readViewSheet(workbook));

  return { habits, history, view };
}

export function writeHabitWorkbook(data: HabitWorkbookData): string {
  const workbook = XLSX.utils.book_new();

  const habitRows = data.habits.map((habit) => ({
    "habit-id": habit.id,
    icon: habit.icon,
    name: habit.name,
    description: habit.description,
    created_at: habit.createdAt,
    category: habit.category,
    period: habit.period,
    deprecated_at: habit.deprecatedAt ?? "",
  }));

  const historyRows = data.history.map((entry) => ({
    datetime: entry.datetime,
    "habit-id": entry.habitId,
    status: entry.status,
    comment: entry.comment,
  }));

  const viewRows = data.view.map((entry) => ({
    "habit-id": entry.habitId,
    order: entry.order,
    hidden: entry.hidden ? "TRUE" : "FALSE",
    color: entry.color ?? "",
  }));

  const habitSheet = sheetFromRows(
    ["habit-id", "icon", "name", "description", "created_at", "category", "period", "deprecated_at"],
    habitRows,
  );
  const historySheet = sheetFromRows(["datetime", "habit-id", "status", "comment"], historyRows);
  const viewSheet = sheetFromRows(["habit-id", "order", "hidden", "color"], viewRows);

  XLSX.utils.book_append_sheet(workbook, habitSheet, HABITS_SHEET_NAME);
  XLSX.utils.book_append_sheet(workbook, historySheet, HISTORY_SHEET_NAME);
  XLSX.utils.book_append_sheet(workbook, viewSheet, VIEW_SHEET_NAME);

  return XLSX.write(workbook, { bookType: "xlsx", type: "base64" });
}

function sheetFromRows(headers: string[], rows: Record<string, unknown>[]) {
  const sheet = XLSX.utils.aoa_to_sheet([headers]);
  if (rows.length > 0) {
    XLSX.utils.sheet_add_json(sheet, rows, {
      header: headers,
      origin: "A2",
      skipHeader: true,
    });
  }
  return sheet;
}

function readHabitsSheet(workbook: XLSX.WorkBook): HabitRow[] {
  const sheet = workbook.Sheets[HABITS_SHEET_NAME];
  if (!sheet) {
    return [];
  }

  type HabitSheetRow = {
    "habit-id"?: string;
    icon?: string;
    name?: string;
    description?: string;
    created_at?: string;
    category?: string;
    period?: string;
    deprecated_at?: string;
  };

  const rows = XLSX.utils.sheet_to_json<HabitSheetRow>(sheet, { defval: "" });

  return rows
    .map((row): HabitRow | null => {
      const id = (row["habit-id"] ?? "").trim();
      if (!id) {
        return null;
      }
      return {
        id,
        icon: row.icon ?? "",
        name: row.name ?? "",
        description: row.description ?? "",
        createdAt: row.created_at ?? new Date().toISOString(),
        category: row.category ?? "",
        period: row.period ?? "",
        deprecatedAt: row.deprecated_at ? row.deprecated_at : null,
      };
    })
    .filter(Boolean) as HabitRow[];
}

function readHistorySheet(workbook: XLSX.WorkBook): HabitHistoryEntry[] {
  const sheet = workbook.Sheets[HISTORY_SHEET_NAME];
  if (!sheet) {
    return [];
  }

  type HistorySheetRow = {
    datetime?: string;
    "habit-id"?: string;
    status?: string;
    comment?: string;
  };

  const rows = XLSX.utils.sheet_to_json<HistorySheetRow>(sheet, { defval: "" });

  return rows
    .map((row): HabitHistoryEntry | null => {
      const datetime = row.datetime ?? "";
      const habitId = (row["habit-id"] ?? "").trim();
      if (!datetime || !habitId) {
        return null;
      }
      return {
        datetime,
        habitId,
        status: row.status ?? "",
        comment: row.comment ?? "",
      };
    })
    .filter(Boolean) as HabitHistoryEntry[];
}

function readViewSheet(workbook: XLSX.WorkBook): HabitViewSettings[] {
  const sheet = workbook.Sheets[VIEW_SHEET_NAME];
  if (!sheet) {
    return [];
  }

  type ViewSheetRow = {
    "habit-id"?: string;
    order?: number | string;
    hidden?: string;
    color?: string;
  };

  const rows = XLSX.utils.sheet_to_json<ViewSheetRow>(sheet, { defval: "" });

  return rows
    .map((row): HabitViewSettings | null => {
      const habitId = (row["habit-id"] ?? "").trim();
      if (!habitId) {
        return null;
      }

      const order = Number(row.order);

      return {
        habitId,
        order: Number.isFinite(order) ? order : 0,
        hidden: row.hidden === "TRUE" || row.hidden === "true",
        color: row.color ?? null,
      };
    })
    .filter(Boolean) as HabitViewSettings[];
}

export function ensureHabitViewSettings(
  habits: HabitRow[],
  view: HabitViewSettings[],
): HabitViewSettings[] {
  const viewMap = new Map(view.map((entry) => [entry.habitId, entry]));
  const habitIds = new Set(habits.map((habit) => habit.id));

  const normalized: HabitViewSettings[] = habits.map((habit, index) => {
    const existing = viewMap.get(habit.id);
    if (existing) {
      return existing;
    }
    return {
      habitId: habit.id,
      order: index,
      hidden: false,
      color: null,
    };
  });

  const orphanedEntries = view.filter((entry) => !habitIds.has(entry.habitId));

  return [...normalized, ...orphanedEntries].sort((a, b) => a.order - b.order);
}
