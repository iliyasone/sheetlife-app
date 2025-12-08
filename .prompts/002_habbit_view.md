# **First Product Specification**

This document defines the work for implementing:

1. The **main interface** (layouts, file explorer, routing)
2. The **Habit View** (first real View)
3. The **local-first storage model**

This is the foundation for all future Views.

---

# **1. Architecture Overview**

Sheetlife is a *local-first* application.
This means:

* The **browser’s localStorage is the primary working storage**, even in production.
* Remote storage and syncing will be added later, but local cached files will always be the main thing the user interacts with.
* Views operate directly on files stored locally.

A “View” is a UI + logic module for working with a particular type of file (e.g. `habits.xlsx`).
Each file is associated with the View that should open it.

---

# **2. Routing & Layout Structure (Next.js App Router)**

Directory structure:

```
app/
  layout.tsx                  → Global layout (header, login)
  views/
    layout.tsx                → Shared shell for all Views
    [viewType]/
      [fileId]/
        page.tsx              → Concrete View (Habit View first)
```

### `app/layout.tsx` (Global)

Always visible:

* Header
* Login / user menu

### `app/views/layout.tsx` (View Shell)

Shared across all Views:

* File Explorer (left sidebar), listing all known files
* Right-click context menu on files (Download)
* Sync status icon placeholder
* Main area where the active View renders

### `app/views/[viewType]/[fileId]/page.tsx`

Loads the file from localStorage and renders the correct View component.

---

# **3. Local File Index (Important)**

The app keeps a **file index** in localStorage.
This index is how the app knows:

* which files exist
* their names
* which view should open each file

Example structure:

```ts
type FileIndexEntry = {
  id: string
  name: string         // e.g. "habits.xlsx"
  viewType: string     // e.g. "habits"
  storageType: "local"
  createdAt: string
}

type FileIndex = {
  files: FileIndexEntry[]
}
```

The File Explorer reads from this index, not from the filesystem.

---

# **4. File Creation Model**

Views create their own file types.

### Habit View → `habits.xlsx`

Behavior:

* When the user first arrives at `sheetlife.app`, they are already *in Habit View*, but there is no file yet.
* When they click **Add Habit** for the first time:

  1. A new file is created (`habits.xlsx`)
  2. Initial sheets are generated (see below)
  3. A new file entry is added to the file index
  4. The View reloads with this file

Future views will create other file types similarly.

---

# **5. Habit File Structure (`habits.xlsx`)**

The file contains two main sheets (third optional later):

### Sheet 1 — `habits`

```
habit-id    icon   name         description                     created_at   category         period   deprecated_at
make-bed    🛏️     Make bed     Make the bed each morning       08-Dec-25    Morning Habits   day      (optional)
```

### Sheet 2 — `history`

```
datetime    habit-id   status   comment
08-Dec-25   make-bed   OK       ""
```

### Optional Sheet — `view`

For storing:

* custom habit order
* hidden habits
* colors
* last opened sub-view
* etc.

This can be added later but the structure should be prepared for it.

---

# **6. Habit View Requirements**

### Layout

A week-based grid:

* Habits listed vertically on the left
* Days of the week horizontally at the top
* Each cell represents (habit × day)
* Clicking a cell inserts an entry into `history`

### Interactions

* **Add Habit**

  * Creates file if it doesn’t yet exist
  * Appends row to `habits` sheet
* **Mark habit done**

  * Adds row to `history` sheet
* **Reorder habits**

  * Persist in `view` sheet
* **Hide habit**

  * Persist in `view` sheet
* **Remove from view** (not deleting habit)

### Additional sub-views

* Month-per-habit calendar
* Year-per-habit heatmap (GitHub-style)
* Ability to view one or multiple habits only

Habit View architecture should be prepared for these, but they are **not** part of this sprint.

---

# **7. LocalStorage as Canonical Storage**

Important clarification:

LocalStorage is **not** a temporary fallback.
It is the main storage layer throughout the app’s lifetime.

Phase 1:

* LocalStorage is the **only** storage
* Future: remote storages may sync with it, but Views still operate on the cached local file

This means:

* File reads/writes must be optimized and reliable
* File index and file content must persist across reloads
* All UI must work fully offline

---

# **8. Deliverables for This Task**

### Layout & Routing

* [ ] Implement global layout
* [ ] Implement Views shell (explorer, sync indicator, chrome)
* [ ] Implement dynamic routing: `/views/[viewType]/[fileId]`

### Local File System Layer

* [ ] File index stored in localStorage
* [ ] Create/delete/read/write local files
* [ ] Explorer UI listing all files
* [ ] Right-click → Download file

### Habit View

* [ ] Sheet loader/writer for `.xlsx`
* [ ] Week-grid UI
* [ ] Add habit
* [ ] Mark habit done
* [ ] Habit reordering (persisted)
* [ ] Prepare for `view` sheet metadata (minimal implementation ok)
* [ ] Additional UI

---

# **9. Clarification**

The question “Who decides which view opens a file?”
→ **Answer: the File Index** (stored in localStorage).

This keeps the actual file formats domain-pure.
