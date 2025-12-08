"use client";

import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  LOCAL_FILE_INDEX_KEY,
  LOCAL_FILE_PREFIX,
  LocalFileIndex,
  LocalFileIndexEntry,
  LocalFileRecord,
} from "@/lib/local-files/types";

type LocalFileSystemValue = {
  ready: boolean;
  index: LocalFileIndexEntry[];
  fileVersions: Record<string, number>;
  getFileRecord: (fileId: string) => LocalFileRecord | null;
  saveFileRecord: (record: LocalFileRecord) => void;
  deleteFileRecord: (fileId: string) => void;
  downloadFile: (fileId: string) => boolean;
};

const LocalFileSystemContext = createContext<LocalFileSystemValue | null>(null);

type ProviderProps = {
  children: ReactNode;
};

export function LocalFileSystemProvider({ children }: ProviderProps) {
  const [index, setIndex] = useState<LocalFileIndexEntry[]>(loadIndexFromStorage);
  const [fileVersions, setFileVersions] = useState<Record<string, number>>({});
  const ready = typeof window !== "undefined";

  const updateIndex = useCallback((updater: (prev: LocalFileIndexEntry[]) => LocalFileIndexEntry[]) => {
    setIndex((prev) => {
      const next = updater(prev);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(LOCAL_FILE_INDEX_KEY, JSON.stringify({ files: next }));
      }
      return next;
    });
  }, []);

  const getFileRecord = useCallback((fileId: string) => {
    if (typeof window === "undefined") {
      return null;
    }
    const raw = window.localStorage.getItem(`${LOCAL_FILE_PREFIX}${fileId}`);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as LocalFileRecord;
    } catch {
      return null;
    }
  }, []);

  const saveFileRecord = useCallback(
    (record: LocalFileRecord) => {
      if (typeof window === "undefined") {
        return;
      }

      window.localStorage.setItem(
        `${LOCAL_FILE_PREFIX}${record.id}`,
        JSON.stringify(record),
      );

      updateIndex((prev) => {
        const existing = prev.find((entry) => entry.id === record.id);
        if (existing) {
          return prev.map((entry) =>
            entry.id === record.id
              ? {
                  ...entry,
                  name: record.name,
                  viewType: record.viewType,
                  updatedAt: record.updatedAt,
                }
              : entry,
          );
        }

        return [
          ...prev,
          {
            id: record.id,
            name: record.name,
            viewType: record.viewType,
            storageType: "local",
            createdAt: record.createdAt,
            updatedAt: record.updatedAt,
          },
        ];
      });

      setFileVersions((prev) => ({
        ...prev,
        [record.id]: (prev[record.id] ?? 0) + 1,
      }));
    },
    [updateIndex],
  );

  const deleteFileRecord = useCallback(
    (fileId: string) => {
      if (typeof window === "undefined") {
        return;
      }

      window.localStorage.removeItem(`${LOCAL_FILE_PREFIX}${fileId}`);

      updateIndex((prev) => prev.filter((entry) => entry.id !== fileId));

      setFileVersions((prev) => {
        const next = { ...prev };
        delete next[fileId];
        return next;
      });
    },
    [updateIndex],
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleStorage = (event: StorageEvent) => {
      if (!event.key) {
        return;
      }

      if (event.key === LOCAL_FILE_INDEX_KEY && event.newValue) {
        try {
          const parsed = JSON.parse(event.newValue) as LocalFileIndex;
          setIndex(parsed.files ?? []);
        } catch {
          // Ignore.
        }
        return;
      }

      if (event.key.startsWith(LOCAL_FILE_PREFIX)) {
        const fileId = event.key.slice(LOCAL_FILE_PREFIX.length);
        setFileVersions((prev) => ({
          ...prev,
          [fileId]: (prev[fileId] ?? 0) + 1,
        }));
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const downloadFile = useCallback(
    (fileId: string) => {
      const record = getFileRecord(fileId);
      if (!record) {
        return false;
      }

      try {
        const blob = base64ToBlob(record.contentBase64, record.mimeType);
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = record.name || `${fileId}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        return true;
      } catch {
        return false;
      }
    },
    [getFileRecord],
  );

  const contextValue = useMemo<LocalFileSystemValue>(
    () => ({
      ready,
      index,
      fileVersions,
      getFileRecord,
      saveFileRecord,
      deleteFileRecord,
      downloadFile,
    }),
    [deleteFileRecord, downloadFile, fileVersions, getFileRecord, index, ready, saveFileRecord],
  );

  return (
    <LocalFileSystemContext.Provider value={contextValue}>
      {children}
    </LocalFileSystemContext.Provider>
  );
}

function loadIndexFromStorage(): LocalFileIndexEntry[] {
  if (typeof window === "undefined") {
    return [];
  }

  const stored = window.localStorage.getItem(LOCAL_FILE_INDEX_KEY);

  if (stored) {
    try {
      const parsed = JSON.parse(stored) as LocalFileIndex;
      return parsed.files ?? [];
    } catch {
      window.localStorage.setItem(
        LOCAL_FILE_INDEX_KEY,
        JSON.stringify({ files: [] satisfies LocalFileIndex["files"] }),
      );
      return [];
    }
  }

  window.localStorage.setItem(
    LOCAL_FILE_INDEX_KEY,
    JSON.stringify({ files: [] satisfies LocalFileIndex["files"] }),
  );
  return [];
}

function base64ToBlob(base64: string, mimeType: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
}

export function useLocalFileSystem() {
  const ctx = useContext(LocalFileSystemContext);
  if (!ctx) {
    throw new Error("useLocalFileSystem must be used within LocalFileSystemProvider");
  }
  return ctx;
}

export function useLocalFileRecord(fileId: string | null) {
  const { ready, getFileRecord } = useLocalFileSystem();

  if (!ready || !fileId) {
    return null;
  }

  return getFileRecord(fileId);
}
