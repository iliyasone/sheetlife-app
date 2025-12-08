"use client";

import { useActionState } from "react";
import { logoutAction, requestLoginCodeAction, verifyLoginCodeAction } from "@/app/actions/auth";
import { initialAuthState } from "@/app/actions/auth-state";

type AuthPanelProps = {
  hasToken: boolean;
  userEmail: string | null;
};

export function AuthPanel({ hasToken, userEmail }: AuthPanelProps) {
  const [requestState, requestAction] = useActionState(
    requestLoginCodeAction,
    initialAuthState,
  );
  const [verifyState, verifyAction] = useActionState(
    verifyLoginCodeAction,
    initialAuthState,
  );

  return (
    <section className="rounded border border-zinc-200 p-4">
      <h2 className="text-lg font-semibold">Authorization</h2>
      {hasToken ? (
        <div className="mt-3 space-y-3 text-sm text-zinc-600">
          <p>
            Signed in as <span className="font-medium text-zinc-900">{userEmail ?? "unknown"}</span>
          </p>
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700"
            >
              Sign out
            </button>
          </form>
        </div>
      ) : (
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <form action={requestAction} className="space-y-2">
            <div>
              <label htmlFor="request-email" className="text-sm font-medium text-zinc-700">
                Email
              </label>
              <input
                id="request-email"
                type="email"
                name="email"
                required
                className="mt-1 w-full rounded border border-zinc-300 px-2 py-1 text-sm"
                placeholder="you@example.com"
                defaultValue={userEmail ?? ""}
              />
            </div>
            <button
              type="submit"
              className="w-full rounded bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700"
            >
              Request code
            </button>
            {requestState.message && (
              <p className={`text-sm ${requestState.ok ? "text-green-600" : "text-red-600"}`}>
                {requestState.message}
              </p>
            )}
          </form>

          <form action={verifyAction} className="space-y-2">
            <div>
              <label htmlFor="verify-email" className="text-sm font-medium text-zinc-700">
                Email
              </label>
              <input
                id="verify-email"
                type="email"
                name="email"
                required
                className="mt-1 w-full rounded border border-zinc-300 px-2 py-1 text-sm"
                placeholder="you@example.com"
                defaultValue={userEmail ?? ""}
              />
            </div>
            <div>
              <label htmlFor="verify-code" className="text-sm font-medium text-zinc-700">
                Code
              </label>
              <input
                id="verify-code"
                type="text"
                name="code"
                required
                className="mt-1 w-full rounded border border-zinc-300 px-2 py-1 text-sm"
                placeholder="123456"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500"
            >
              Verify &amp; sign in
            </button>
            {verifyState.message && (
              <p className={`text-sm ${verifyState.ok ? "text-green-600" : "text-red-600"}`}>
                {verifyState.message}
              </p>
            )}
          </form>
        </div>
      )}
    </section>
  );
}
