import Link from "next/link";
import { redirect } from "next/navigation";
import { getAccessTokenFromCookies } from "@/lib/auth-cookies";
import { FileMetadata, getFileContent, listFiles } from "@/lib/core-api";

type FilePageProps = {
  params: {
    storageName: string;
    filename: string;
  };
};

export const dynamic = "force-dynamic";

export default async function FileRawViewPage({ params }: FilePageProps) {
  const token = await getAccessTokenFromCookies();
  if (!token) {
    redirect("/");
  }

  const storageName = decodeURIComponent(params.storageName);
  const filename = decodeURIComponent(params.filename);

  let metadata: FileMetadata | null = null;
  let metadataError: string | null = null;
  let content: string | null = null;
  let contentType = "application/octet-stream";
  let contentError: string | null = null;

  try {
    const files = await listFiles(storageName, token);
    metadata = files.find((file) => file.filename === filename) ?? null;
  } catch (error) {
    metadataError = error instanceof Error ? error.message : "Failed to load metadata.";
  }

  try {
    const response = await getFileContent(storageName, filename, token);
    content = formatContent(response.content, response.contentType);
    contentType = response.contentType;
  } catch (error) {
    contentError = error instanceof Error ? error.message : "Failed to load file content.";
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 p-6 sm:p-10">
      <header className="flex flex-col gap-2">
        <Link
          href={`/storages/${encodeURIComponent(storageName)}`}
          className="text-sm font-medium text-emerald-600 hover:text-emerald-500"
        >
          ← Back to {storageName}
        </Link>
        <h1 className="text-3xl font-semibold">{filename}</h1>
        <p className="text-sm text-zinc-600">
          Raw view powered by <code>/storages/{storageName}/files/{filename}</code>
        </p>
      </header>

      {metadata && (
        <div className="grid gap-2 rounded border border-zinc-200 p-4 text-sm text-zinc-700 sm:grid-cols-2">
          <MetaItem label="Mime type" value={metadata.mime_type} />
          <MetaItem label="Version" value={metadata.version.toString()} />
          <MetaItem label="Updated" value={new Date(metadata.updated_at).toLocaleString()} />
          <MetaItem label="Created" value={new Date(metadata.created_at).toLocaleString()} />
          <MetaItem label="Sync status" value={metadata.sync_status} />
          {metadata.description && <MetaItem label="Description" value={metadata.description} />}
        </div>
      )}
      {metadataError && (
        <p className="rounded border border-red-100 bg-red-50 p-3 text-sm text-red-700">
          {metadataError}
        </p>
      )}

      <section className="flex flex-col gap-2">
        <div>
          <h2 className="text-lg font-semibold">File content</h2>
          <p className="text-xs uppercase tracking-wide text-zinc-500">{contentType}</p>
        </div>
        {contentError && (
          <p className="rounded border border-red-100 bg-red-50 p-3 text-sm text-red-700">
            {contentError}
          </p>
        )}
        {content !== null && (
          <pre className="overflow-x-auto rounded border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-800">
            {content}
          </pre>
        )}
      </section>
    </main>
  );
}

function formatContent(rawContent: string, type: string) {
  if (type.includes("application/json")) {
    try {
      const parsed = JSON.parse(rawContent);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return rawContent;
    }
  }
  return rawContent;
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="font-medium text-zinc-900">{value}</p>
    </div>
  );
}
