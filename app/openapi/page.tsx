import { fetchOpenApiSpec } from "@/lib/core-api";

export const dynamic = "force-dynamic";

export default async function OpenApiPage() {
  const spec = await fetchOpenApiSpec();

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 p-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Sheetlife OpenAPI</h1>
        <p className="text-sm text-zinc-600">
          Data fetched from <code>https://api.sheetlife.app/openapi.json</code>
        </p>
      </div>
      <pre className="overflow-x-auto rounded border border-zinc-200 bg-zinc-950 p-4 text-sm text-zinc-100">
        {JSON.stringify(spec, null, 2)}
      </pre>
    </main>
  );
}

