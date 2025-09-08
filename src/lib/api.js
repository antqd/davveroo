// src/lib/api.js
import { getToken } from './auth';

// Usa sempre il proxy /api (Vite già instrada verso https://api.davveroo.it)
const API_BASE = '/api';
const _API_BASE = API_BASE.replace(/\/+$/, '');
const join = (p) => `${_API_BASE}/${String(p).replace(/^\/+/, '')}`;

async function handle(r) {
  if (!r.ok) {
    const t = await r.text().catch(() => "");
    throw new Error(`HTTP ${r.status} @ ${r.url} ${t || r.statusText}`);
  }
  return r.json();
}

export async function apiGet(path) {
  const token = getToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  return handle(await fetch(join(path), { cache: "no-store", headers }));
}
export async function apiPost(path, body, headers = {}) {
  const token = getToken();
  const auth = token ? { Authorization: `Bearer ${token}` } : {};
  return handle(
    await fetch(join(path), {
      method: "POST",
      headers: { "Content-Type": "application/json", ...auth, ...headers },
      body: JSON.stringify(body),
    })
  );
}

// Convenience helpers for auth endpoints
export const apiAuth = {
  async login(email, password, selectedRoles = []) {
    // selectedRoles is for UX; backend should validate actual roles
    return apiPost('/auth/login', { email, password, roles: selectedRoles });
  },
  async register(payload) {
    // payload: { name, email, password, roles: [] }
    return apiPost('/auth/register', payload);
  }
}
