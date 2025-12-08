import Link from "next/link";
import { redirect } from "next/navigation";
import { getAccessTokenFromCookies } from "@/lib/auth-cookies";
import { FileMetadata, listFiles } from "@/lib/core-api";

type StoragePageProps = {
  params: {
    storageName: string;
  };
};

export const dynamic = "force-dynamic";

export default async function StoragePage({ params }: StoragePageProps) {
  const token = await getAccessTokenFromCookies();
  if (!token) {
    redirect("/");
  }

  const storageName = decodeURIComponent(params.storageName);

  let files: FileMetadata[] = [];
  let error: string | null = null;

  try {
    files = await listFiles(storageName, token);
  } catch (err) {
    error = err instanceof Error ? err.message : "Unable to load files.";
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 p-6 sm:p-10">
      <header className="flex flex-col gap-2">
        <Link
          href="/"
          className="text-sm font-medium text-emerald-600 hover:text-emerald-500"
        >
          ← Back to storages
        </Link>
        <h1 className="text-3xl font-semibold">Storage: {storageName}</h1>
        <p className="text-sm text-zinc-600">
          Files are loaded from <code>/storages/{storageName}/files</code>.
        </p>
      </header>

      {error && (
        <p className="rounded border border-red-100 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {files.length > 0 ? (
        <div className="overflow-hidden rounded border border-zinc-200">
          <table className="min-w-full divide-y divide-zinc-200 text-sm">
            <thead className="bg-zinc-50">
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                <th className="px-4 py-2">Filename</th>
                <th className="px-4 py-2">Mime type</th>
                <th className="px-4 py-2">Version</th>
                <th className="px-4 py-2">Updated</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 bg-white">
              {files.map((file) => (
                <tr key={file.id}>
                  <td className="px-4 py-2 font-medium text-zinc-900">{file.filename}</td>
                  <td className="px-4 py-2">{file.mime_type}</td>
                  <td className="px-4 py-2">{file.version}</td>
                  <td className="px-4 py-2 text-zinc-600">
                    {new Date(file.updated_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-2">
                    <Link
                      href={`/storages/${encodeURIComponent(storageName)}/files/${encodeURIComponent(file.filename)}`}
                      className="text-sm font-medium text-emerald-600 hover:text-emerald-500"
                    >
                      Raw view →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        !error && <p className="text-sm text-zinc-600">No files found in this storage.</p>
      )}
    </main>
  );
}
