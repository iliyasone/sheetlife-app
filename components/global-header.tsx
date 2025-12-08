import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import { getAccessTokenFromCookies, getUserEmailFromCookies } from "@/lib/auth-cookies";
import { DEFAULT_HABITS_FILE_ID, HABIT_VIEW_TYPE } from "@/lib/habits/constants";

export async function GlobalHeader() {
  const token = await getAccessTokenFromCookies();
  const email = await getUserEmailFromCookies();

  return (
    <header className="border-b border-zinc-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link
            href={`/views/${HABIT_VIEW_TYPE}/${DEFAULT_HABITS_FILE_ID}`}
            className="text-lg font-semibold text-zinc-900"
          >
            Sheetlife
          </Link>
          <nav className="hidden gap-4 text-sm font-medium text-zinc-600 sm:flex">
            <Link
              href={`/views/${HABIT_VIEW_TYPE}/${DEFAULT_HABITS_FILE_ID}`}
              className="hover:text-zinc-900"
            >
              Habits
            </Link>
            <Link href="/core" className="hover:text-zinc-900">
              Core API
            </Link>
            <Link href="/openapi" className="hover:text-zinc-900">
              OpenAPI
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3 text-sm text-zinc-600">
          {token ? (
            <>
              <span className="hidden sm:inline">Signed in as</span>
              <span className="font-medium text-zinc-900">{email ?? "unknown"}</span>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="rounded border border-zinc-300 px-3 py-1 text-sm font-medium text-zinc-800 hover:bg-zinc-100"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/core#auth"
              className="rounded border border-zinc-300 px-3 py-1 text-sm font-medium text-zinc-800 hover:bg-zinc-100"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
