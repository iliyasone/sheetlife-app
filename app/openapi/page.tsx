// app/openapi/page.tsx

export const dynamic = "force-dynamic"; 
// ensures the server fetch runs every request (not static)

export default async function OpenApiPage() {
  const url = "https://api.sheetlife.app/openapi.json"

  const res = await fetch(url, {
    // tell Next: server-side only, no client caching
    cache: "no-store"
  })

  if (!res.ok) {
    throw new Error("Failed to load OpenAPI spec")
  }

  const data = await res.json()

  return (
    <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Sheetlife OpenAPI</h1>
      <pre
        style={{
          background: "#111",
          color: "#eee",
          padding: "1rem",
          borderRadius: "8px",
          overflowX: "auto",
          lineHeight: "1.4",
          fontSize: "14px",
        }}
      >
        {JSON.stringify(data, null, 2)}
      </pre>
    </main>
  )
}
