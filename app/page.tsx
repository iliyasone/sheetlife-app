import { redirect } from "next/navigation";
import { DEFAULT_HABITS_FILE_ID, HABIT_VIEW_TYPE } from "@/lib/habits/constants";

export default function HomePage() {
  redirect(`/views/${HABIT_VIEW_TYPE}/${DEFAULT_HABITS_FILE_ID}`);
}
