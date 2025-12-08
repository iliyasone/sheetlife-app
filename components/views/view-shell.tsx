"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  MouseEvent,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useLocalFileSystem } from "@/components/local-files-provider";

type ViewShellProps = {
  children: ReactNode;
};

type ContextMenuState = {
  fileId: string;
  x: number;
  y: number;
};

export function ViewShell({ children }: ViewShellProps) {
  const params = useParams<{ viewType?: string; fileId?: string }>();
  const activeFileId =
    typeof params?.fileId === "string" ? params.fileId : "";
  const { index, ready } = useLocalFileSystem();
  const [menuState, setMenuState] = useState<ContextMenuState | null>(null);

  const activeEntry = useMemo(
    () => index.find((entry) => entry.id === activeFileId) ?? null,
    [activeFileId, index],
  );

  const handleContextMenu = useCallback(
    (fileId: string) => (event: MouseEvent) => {
      event.preventDefault();
      setMenuState({
        fileId,
        x: event.clientX,
        y: event.clientY,
      });
    },
    [],
  );

  useEffect(() => {
    if (!menuState) {
      return;
    }

    const closeMenu = () => setMenuState(null);
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuState(null);
      }
    };

    window.addEventListener("click", closeMenu);
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("click", closeMenu);
      window.removeEventListener("keydown", handleKey);
    };
  }, [menuState]);

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl gap-6 px-4 py-6">
      <aside className="w-64 shrink-0">
        <div className="sticky top-24 rounded border border-zinc-200 bg-white/90 p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500">
                Local files
              </p>
              <p className="text-sm text-zinc-600">
                Right-click to download
              </p>
            </div>
            <span className="text-xs font-medium text-zinc-500">
              {index.length}
            </span>
          </div>

          {!ready ? (
            <p className="text-sm text-zinc-500">Loading local files…</p>
          ) : index.length === 0 ? (
            <p className="text-sm text-zinc-500">
              No files yet. Use a view to create one.
            </p>
          ) : (
            <ul className="space-y-1">
              {index.map((entry) => {
                const isActive = entry.id === activeFileId;
                return (
                  <li key={entry.id}>
                    <Link
                      href={`/views/${entry.viewType}/${entry.id}`}
                      onContextMenu={handleContextMenu(entry.id)}
                      className={`block rounded border px-3 py-2 text-sm transition ${
                        isActive
                          ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                          : "border-transparent text-zinc-700 hover:border-zinc-200 hover:bg-zinc-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{entry.name}</span>
                        <span className="text-xs uppercase tracking-wide text-zinc-400">
                          {entry.viewType}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500">
                        Updated{" "}
                        {new Date(entry.updatedAt).toLocaleDateString()}
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>

      <section className="flex flex-1 flex-col gap-4 pb-10">
        <div className="rounded border border-zinc-200 bg-white/80 px-4 py-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500">
                Active view
              </p>
              <h1 className="text-xl font-semibold text-zinc-900">
                {activeEntry?.name ?? "New habits workbook"}
              </h1>
            </div>
            <SyncIndicator />
          </div>
        </div>
        <div className="flex-1 rounded border border-zinc-200 bg-white/90 p-4 shadow-sm">
          {children}
        </div>
      </section>

      {menuState && (
        <FileContextMenu position={menuState} onClose={() => setMenuState(null)} />
      )}
    </div>
  );
}

function SyncIndicator() {
  return (
    <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
      <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      Local-first
    </div>
  );
}

function FileContextMenu({
  position,
  onClose,
}: {
  position: ContextMenuState;
  onClose: () => void;
}) {
  const { downloadFile } = useLocalFileSystem();

  const handleDownload = () => {
    downloadFile(position.fileId);
    onClose();
  };

  return (
    <div
      className="fixed z-50 w-40 rounded border border-zinc-200 bg-white shadow-lg"
      style={{ top: position.y, left: position.x }}
      onClick={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        onClick={handleDownload}
        className="block w-full px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100"
      >
        Download file
      </button>
    </div>
  );
}
