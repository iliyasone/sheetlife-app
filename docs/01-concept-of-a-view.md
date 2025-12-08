# The Concept of a View**

A **View** in Sheetlife defines the domain semantics for a particular file type. A view knows how to interpret a file, what actions are allowed on that file, and how those actions transform it. A view does *not* store data itself; it operates on text files provided by the system’s storage layer.

The key design principle is that a view’s logic is **pure** and can run in multiple environments. Sheetlife separates *semantics* from *orchestration*: a view defines how a file changes, while the surrounding runtime decides where the file comes from and where it is saved.

---

## **1. Responsibilities of a View**

A View provides:

1. **A file model**
   How to parse and interpret the file’s text representation.

2. **A set of domain actions**
   These actions express domain-level intent (e.g., “add item”, “toggle state”, “record event”).
   Each action is a structured input, not an imperative script.

3. **A pure transformation function**
   Given the current file text and an action, return the new file text.
   This function has no side effects, does not perform I/O, and does not depend on runtime context.

4. **Optional derived state**
   Pure selectors that compute view-model data for UI or other consumers.

Views never perform:

* Network calls
* Database or file writes
* Authentication or authorization
* Logging, telemetry, or sync orchestration

These belong to Sheetlife’s runtime layers, not to views.

---

## **2. A View as a Pure Module**

Every view is implemented as a shared module (usually TypeScript). This module must remain deterministic and context-free. It exposes two central primitives:

```ts
type Action = { type: string; payload: any }

function applyAction(fileText: string, action: Action): string
```

This is the canonical definition of domain behavior.

Because the module is pure and has no dependency on browser APIs, Node APIs, or backend services, it can be executed in any JS/TS environment.

---

## **3. Three Runtimes That Can Execute View Logic**

Sheetlife has three places capable of *running* a view, but only two of them actually execute its semantics.

### **3.1 Browser (Frontend JS)**

The browser is the primary runtime for fast interaction and offline-first behavior.

Typical flow:

1. Load file content from local storage or backend.
2. Apply an action using the view’s pure function.
3. Update UI immediately.
4. Optionally write the updated file back to storage.

This enables offline work, instant feedback, and optimistic UI patterns.

### **3.2 Next.js Backend (Backend-for-Frontend)**

The Next.js server can also run the view module. It is used when:

* The operation must be authoritative or secure.
* User input needs server-side validation.
* Different clients need consistent results.
* Heavier computation is required.

Flow:

1. Client sends `{ fileId, action }` to a Next.js route.
2. Next.js fetches the file from the FastAPI backend.
3. The view’s pure function computes the new file.
4. Next.js writes the updated file back to the backend.
5. Client receives the updated file or a projection.

This does not change the view semantics. The same logic is reused.

### **3.3 FastAPI Backend (Private Backend)**

FastAPI never executes view logic.

Its responsibilities:

* Store and return file content
* Synchronize storages
* Manage auth, ownership, metadata
* Log operations

FastAPI is intentionally domain-agnostic. It never “knows” what a view means.

---

## **4. Why Two Execution Sites for View Logic?**

Allowing view logic to run both in the browser and in the Next.js backend offers flexibility while preserving a clean architecture:

* **Offline-first** (browser)
* **Authoritative or secure updates** (Next.js)
* **Zero duplication** because the semantics are defined once
* **Predictable behavior** because the logic is pure and deterministic
* **Extensibility**: any new view automatically inherits these guarantees

The location of execution changes, but the meaning of the action never does.

---

## **5. In Summary**

A View is the semantic layer for a file type.
Its logic is pure, deterministic, and environment-agnostic.
It may be executed:

* in the **browser** for immediacy and offline use
* in the **Next.js backend** for secure or authoritative updates

but it is **never** executed inside the FastAPI backend.

The separation ensures that Sheetlife remains flexible, offline-capable, and extensible, while keeping view definitions simple and isolated from infrastructure concerns.
