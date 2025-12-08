import { getCoreApiUrl } from "@/lib/config";

const CORE_API_URL = getCoreApiUrl();

export type StorageRead = {
  id: number;
  name: string;
  provider: string;
  provider_config: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export type FileMetadata = {
  id: number;
  filename: string;
  mime_type: string;
  version: number;
  hash: string;
  external_id: string | null;
  last_synced_at: string | null;
  sync_status: string;
  remote_revision: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
};

type ApiListResponse<T> = {
  items: T[];
};

function withAuthHeaders(token: string, extra?: HeadersInit): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    ...extra,
  };
}

async function parseJson<T>(res: Response, errorContext: string): Promise<T> {
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${errorContext}: ${res.status} ${res.statusText} – ${body}`);
  }
  return (await res.json()) as T;
}

export async function listStorages(token: string) {
  const res = await fetch(`${CORE_API_URL}/storages`, {
    headers: withAuthHeaders(token),
    cache: "no-store",
  });
  const data = await parseJson<ApiListResponse<StorageRead>>(res, "Failed to load storages");
  return data.items;
}

export async function listFiles(storageName: string, token: string) {
  const res = await fetch(
    `${CORE_API_URL}/storages/${encodeURIComponent(storageName)}/files`,
    {
      headers: withAuthHeaders(token),
      cache: "no-store",
    },
  );
  const data = await parseJson<ApiListResponse<FileMetadata>>(res, "Failed to load files");
  return data.items;
}

export async function getFileContent(storageName: string, filename: string, token: string) {
  const res = await fetch(
    `${CORE_API_URL}/storages/${encodeURIComponent(storageName)}/files/${encodeURIComponent(filename)}`,
    {
      headers: withAuthHeaders(token),
      cache: "no-store",
    },
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to load file: ${res.status} ${res.statusText} – ${body}`);
  }

  const contentType = res.headers.get("content-type") ?? "application/octet-stream";
  const bodyText = await res.text();

  return {
    content: bodyText,
    contentType,
  };
}

export async function fetchOpenApiSpec() {
  const res = await fetch(`${CORE_API_URL}/openapi.json`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Failed to load OpenAPI spec: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

