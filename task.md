#### Sheetlife – Frontend / Backend Contract for Codex

**High-level product model**

Sheetlife is a system where **files are the truth** and the “app” is just a set of views over those files.

* The **backend** (FastAPI) is private and generic. It:

  * manages users, auth and permissions,
  * manages “storages” (logical groups of files),
  * exposes operations to read and write files,
  * handles sync and caching with external sources (Google Sheets, etc.).
* The **frontend** (Next.js on Vercel, public/open-source) is a collection of “views” that interpret those files and provide UX like “mark habit done”, “add task”, etc.
* We want the backend to *not* know about domain concepts like “habit”, “task”, “budget”. Those should live in views.

Think “backend is a generic file protocol”, “frontend is interpretation”.

---

**Backend you will talk to**

* Base URL (prod): `https://api.sheetlife.app`
* OpenAPI spec: `https://api.sheetlife.app/openapi.json` 

Treat this as your main source of truth for endpoints and types.

Core concepts in the backend API:

* **Storage** – a named logical space containing files.
* **File** – opaque content that is the canonical data (e.g. CSV, JSON, markdown, whatever).
* Basic operations (names may differ, but semantically):

  * list storages
  * list files in a storage
  * get file contents
  * write / append / patch file contents
* The backend is intentionally **view-agnostic**: it doesn’t know that a particular file is “habits” or “expenses”. It just sees bytes / records.

Auth model:

* We’ll standardize on a simple mechanism (e.g. `Authorization: Bearer <token>` header) that you add in server-side fetches.
* Whatever we decide, you should:

  * **never** expose secrets to the browser,
  * use environment variables (e.g. `CORE_API_URL`, `CORE_API_TOKEN`) only inside server code (Server Components / Route Handlers / Server Actions).

---

**Frontend architecture (Next.js + Vercel)**

Frontend base URL: `https://sheetlife.app`.

We’ll use the **App Router** (i.e. `app/` directory) and lean heavily on **Server Components** and **Server Actions** so that:

* Data fetching is done on the server.
* Calls to the backend are never visible from the browser.
* Logic that is “file + view specific” lives on the server side inside the Next app (Backend For Frontend pattern).

Example:

We want a page at `/openapi` that:

* runs on the server,
* fetches `https://api.sheetlife.app/openapi.json`,
* and renders it formatted as JSON.

Rough shape:

```tsx
// app/openapi/page.tsx
export const dynamic = "force-dynamic";

export default async function OpenApiPage() {
  const res = await fetch("https://api.sheetlife.app/openapi.json", {
    cache: "no-store"
  });

  if (!res.ok) {
    throw new Error("Failed to load OpenAPI spec");
  }

  const spec = await res.json();

  return (
    <main>
      <h1>Sheetlife OpenAPI</h1>
      <pre>{JSON.stringify(spec, null, 2)}</pre>
    </main>
  );
}
```

This runs completely on the server; the browser only sees HTML.

---

**Where to put “file + view” logic**

The key rule for you:

> If something is “what this file means in this view”, that logic belongs in the Next app (server-side), not in FastAPI and not in the browser.

Concrete pattern:

* You write view-specific functions as **Server Actions** or as helpers used by Route Handlers.
* Those functions:

  * call the generic backend endpoints (`/storages/...`, `/files/...`),
  * interpret and transform the returned data,
  * may combine multiple backend calls,
  * may call other external services (e.g. LLM APIs, third-party tools),
  * and then hand data to React components.

Example sketch:

```ts
// app/(views)/habits/actions.ts
"use server";

const CORE_API_URL = process.env.CORE_API_URL as string;
const CORE_API_TOKEN = process.env.CORE_API_TOKEN as string;

export async function addHabitEvent(params: {
  storageId: string;
  fileId: string;
  date: string;
  done: boolean;
}) {
  const res = await fetch(
    `${CORE_API_URL}/storages/${params.storageId}/files/${params.fileId}/append`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${CORE_API_TOKEN}`,
      },
      body: JSON.stringify({
        type: "habit_event",
        date: params.date,
        done: params.done,
      }),
    }
  );

  if (!res.ok) {
    throw new Error("Failed to append habit event");
  }

  return res.json();
}
```

Then in a React component:

```tsx
import { addHabitEvent } from "./actions";

export default function HabitButton(props: { storageId: string; fileId: string; date: string }) {
  async function action() {
    "use server";
    await addHabitEvent({
      storageId: props.storageId,
      fileId: props.fileId,
      date: props.date,
      done: true,
    });
  }

  return (
    <form action={action}>
      <button type="submit">Mark done</button>
    </form>
  );
}
```

Important:

* The “habit_event” concept is **not** in the backend. It’s in this view.
* The backend only knows: “there is a file; you asked me to append this JSON blob”.
* This code runs on the server in Vercel, so env vars and tokens stay secret.

---

**Private views and forks**

The frontend repo is intended to be **open-source and forkable**.

* A “view” is essentially a directory under `app/` with:

  * one or more page components,
  * some server actions for its file semantics,
  * optionally some client components.
* Anyone can fork the repo and:

  * change how a particular file type is interpreted,
  * add their own private integrations (e.g. AI calls with their own API keys),
  * or build new kinds of views.

Because view logic lives on the server, forks can:

* add their own `process.env.MY_PRIVATE_API_KEY`,
* call their own AI endpoints or microservices,
* and keep all that private while still using the same core backend protocol.

Your job is to respect the backend contract and keep domain semantics in the view layer, not in the core FastAPI service. 

Start with simple: impelement authorization, view all storages, view all files, and simple "raw" view, which would just open a file content