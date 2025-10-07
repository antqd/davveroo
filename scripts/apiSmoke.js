/**
 * Semplice smoke-test per verificare se l'API risponde.
 * Usa fetch tramite Node 18+.
 *
 * Variabili supportate:
 * - API_ORIGIN (es. https://bc.davveroo.it/api)
 * - API_TOKEN  (opzionale, aggiunto come Bearer)
 */
const origin =
  process.env.API_ORIGIN ||
  process.env.VITE_API_ORIGIN ||
  "https://api.davveroo.it/api";
const token = process.env.API_TOKEN;

const endpoints = [
  { method: "GET", path: "/health/ping" },
  { method: "GET", path: "/customers" },
  { method: "GET", path: "/products" },
];

async function callEndpoint({ method, path, body }) {
  const url =
    origin.endsWith("/") && path.startsWith("/")
      ? origin.slice(0, -1) + path
      : origin + path;

  const headers = { "User-Agent": "davveroo-smoke-test" };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers["Content-Type"] = "application/json";

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  return {
    status: res.status,
    ok: res.ok,
    url,
    body: text.slice(0, 160),
  };
}

async function run() {
  console.log(`🔍 Smoke test API su ${origin}`);
  for (const ep of endpoints) {
    try {
      const result = await callEndpoint(ep);
      console.log(
        `${ep.method} ${result.url} → ${result.status} ${
          result.ok ? "OK" : "FAIL"
        }`
      );
      if (!result.ok) {
        console.log(`  Body: ${result.body}`);
      }
    } catch (e) {
      console.error(`${ep.method} ${ep.path} → errore: ${e.message}`);
    }
  }
}

run();
