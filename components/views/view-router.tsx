"use client";

import { HABIT_VIEW_TYPE } from "@/lib/habits/constants";
import { HabitView } from "@/components/views/habits/habit-view";

type ViewRouterProps = {
  viewType: string;
  fileId: string;
};

export function ViewRouter({ viewType, fileId }: ViewRouterProps) {
  if (viewType === HABIT_VIEW_TYPE) {
    return <HabitView fileId={fileId} />;
  }

  return (
    <div className="space-y-3">
      <p className="text-lg font-semibold text-zinc-900">
        Unknown view: <code>{viewType}</code>
      </p>
      <p className="text-sm text-zinc-600">
        This build only implements the Habit View. Create files with the{" "}
        <code>{HABIT_VIEW_TYPE}</code> view type to get started.
      </p>
    </div>
  );
}
