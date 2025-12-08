import Link from "next/link";
import { AuthPanel } from "@/components/auth-panel";
import { getAccessTokenFromCookies, getUserEmailFromCookies } from "@/lib/auth-cookies";
import { listStorages } from"@/lib/core-api";
 
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const token = await getAccessTokenFromCookies();
  const userEmail = await getUserEmailFromCookies();

  let storages: Awaited<ReturnType<typeof listStorages>> | null = null;
  let storagesError: string | null = null;

  if (token) {
    try {
      storages = await listStorages(token);
    } catch (error) {
      storagesError = error instanceof Error ? error.message : "Failed to load storages.";
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 p-6 sm:p-10">
      <header className="flex flex-col gap-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">
          Sheetlife Views
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Files as the source of truth</h1>
        <p className="text-base text-zinc-600">
          Sign in with your email, fetch storages from the Core API, drill into files, and view their
          raw contents directly from the Sheetlife backend.
        </p>
      </header>

      <section className="space-y-4 rounded border border-zinc-200 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Storages</h2>
            <p className="text-sm text-zinc-600">Fetched via <code>/storages</code>.</p>
          </div>
          <Link
            href="/openapi"
            className="text-sm font-medium text-emerald-600 hover:text-emerald-500"
          >
            View OpenAPI spec
          </Link>
        </div>
        {!token && (
          <p className="text-sm text-zinc-600">
            Sign in first to list storages. Use the forms below to request and verify a magic code.
          </p>
        )}
        {storagesError && (
          <p className="rounded border border-red-100 bg-red-50 p-3 text-sm text-red-700">
            {storagesError}
          </p>
        )}
        {storages && storages.length > 0 && (
          <ul className="divide-y divide-zinc-200 rounded border border-zinc-200">
            {storages.map((storage) => (
              <li key={storage.id} className="flex flex-col gap-1 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-zinc-900">{storage.name}</p>
                  <p className="text-xs text-zinc-500">
                    Provider: {storage.provider} • Updated {new Date(storage.updated_at).toLocaleString()}
                  </p>
                </div>
                <Link
                  href={`/storages/${encodeURIComponent(storage.name)}`}
                  className="text-sm font-medium text-emerald-600 hover:text-emerald-500"
                >
                  Browse files →
                </Link>
              </li>
            ))}
          </ul>
        )}
        {storages && storages.length === 0 && (
          <p className="text-sm text-zinc-600">No storages available for this account.</p>
        )}
      </section>

      <AuthPanel hasToken={Boolean(token)} userEmail={userEmail} />
    </main>
  );
}
