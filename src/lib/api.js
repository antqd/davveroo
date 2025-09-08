// src/lib/api.js
const API_BASE =
  // in dev leggo da .env (Vite) se c'è, altrimenti /api
  (import.meta?.env?.VITE_API_BASE && import.meta.env.VITE_API_BASE.replace(/\/+$/,'')) ||
  '/api';

const join = (p) => `${API_BASE}/${String(p).replace(/^\/+/, '')}`;

async function handle(r) {
  const ct = r.headers.get('content-type') || '';
  const txt = await r.text();
  if (!r.ok) {
    throw new Error(`HTTP ${r.status} @ ${r.url}\n${txt.slice(0,200)}`);
  }
  if (!/application\/json/i.test(ct)) {
    throw new Error(`Non-JSON @ ${r.url}\n${txt.slice(0,200)}`);
  }
  try { return JSON.parse(txt); }
  catch { throw new Error(`Bad JSON @ ${r.url}\n${txt.slice(0,200)}`); }
}

export async function apiGet(path) {
  return handle(await fetch(join(path), { cache: 'no-store' }));
}
export async function apiPost(path, body, headers = {}) {
  return handle(await fetch(join(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body ?? {})
  }));
}