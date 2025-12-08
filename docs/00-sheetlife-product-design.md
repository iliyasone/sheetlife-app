# Sheetlife Product Design

## Vision & Philosophy

Sheetlife aims to redefine personal productivity systems by treating the user’s own files (such as spreadsheets, markdown files, or external resources like Google Sheets or Telegram channels) as the primary, trustworthy source of data. The product is not just a habit tracker or data-entry tool: it is a protocol and platform for running personal systems, where every view is simply an open, forkable frontend over transparent, human-readable files.

* **Data is public and user-owned.**
* **Frontend is open source and forkable.**
* **Backend is private, handles sync/auth, and is invisible in daily use.**
* **No black box: users can always see and export their real files.**

## Core Product Model

### Storage

* Each user has one or more "storages"—logical groupings of files.
* Storage may be:

  * **Internal** (all files in the app’s own database)
  * Connected to an external service (Google Sheets, Telegram, etc.)
* Every file is the ground truth. The system never “owns” the data, only provides access, caching, and sync.
* Intermediate/cached copies are used for performance but never replace the canonical version.

### Views

* A “view” is a frontend module for interacting with a file (e.g., viewing, editing, analyzing, or logging data).
* Views are front end NextJS apps/pages that interpret files in user storage.
* The frontend is designed for remixing, forking, and modular extension—users or developers can create and share new views.
* Each view is mapped to a URL of the form:

  `sheetlife.app/user/storage_name/filename/view_name`

### Actions & Interaction

* Users interact through familiar workflows (“mark habit done”, “log expense”), not file operations.
* Views abstract file mechanics: actions translate to file mutations and commits, but the user only sees the result.
* Power users and developers can inspect, download, or directly edit the underlying files at any time.

## Sync & Caching Model

* For local storage: edits and reads are instantaneous (the DB is canonical).
* For external storage (Google Sheets, Drive, etc.):

  * The app keeps a cached copy for low latency.
  * All changes go to the cache first, then are pushed to the external system (with full file rewrites initially).
  * Sync is visible and auditable; users can trigger a re-sync or view sync state.
* All files remain exportable in human-readable formats.

## Backend Protocol vs View Semantics

The backend embodies a stable, domain‑agnostic protocol. It understands storages, files, permissions, and synchronization, but it has no knowledge of higher‑level concepts such as habits, tasks, journals, or financial ledgers. The backend accepts content, validates access, and persists changes. Semantics—what a line in a file means, how a record is interpreted, what a view does with it—belongs exclusively to the frontend.

A view may express its own schema, conventions, indexing rules, or mutations. For example, a habit tracking view may treat each record as a date‑event pair, while a budgeting view may treat lines as transactions. These interpretations do not modify the backend protocol. They emerge in the view layer and are free to evolve without requiring backend changes.

This separation makes the backend stable and dependable, while giving views the creative freedom to define meaning on their own terms.

## Private Views and Server Logic

Views are not only visual components; they are self‑contained modules with their own server‑side logic. In NextJS, view logic runs on the server and is invisible to the client. Server Components, Route Handlers, and Server Actions allow a view to:

* Fetch data from the core backend privately.
* Apply domain‑specific transformations.
* Execute multi‑step workflows.
* Call external services or AI models.
* Use private environment variables and secrets.

Because logic is executed server‑side, keys and integrations remain confidential. A view can be forked publicly while still allowing a user to attach their own private API credentials or custom connectors.

Forks may diverge in semantics. A community member might rewrite a habit view to treat events as streak counters or build an entirely new view interpreting the same file as a spaced repetition log. Forks can coexist as long as they speak the backend protocol.

## Openness & Extensibility

* Frontend (NextJS/Vercel) is public, open source, and “one-click forkable.”
* Backend (Python/FastAPI) is private but exposes public protocols for auth, file access, sync.
* Anyone can develop a new view or module and connect it to Sheetlife, using the open protocols and the transparent file model.

## Product Positioning

Sheetlife is not “yet another productivity app.”

* It is not a Notion/Obsidian clone: it does not trap data or hide logic in proprietary structures.
* It is a protocol for running and remixing open systems, driven by the most “human” of databases—plain files.
* The primary value is autonomy, transparency, and the ability to extend the system without lock-in or vendor constraint.

## Technical Snapshot

* Frontend: NextJS (Vercel), open source, modular, easily forkable and remixable.
* Backend: Python 3.13, FastAPI, handles sync, file I/O, auth, and minimal logic.
* Storage: App database for local, connectors for Google Sheets/Drive/etc. with caching.
* All business logic is exposed via files and views—backend only mediates, never traps.

## Philosophy in Practice

Sheetlife builds systems, not features; enables protocols, not black boxes; and empowers users to inspect, export, and remix every part of their digital life systems.
