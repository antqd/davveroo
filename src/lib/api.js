import { getToken } from './auth';

// Imposta VITE_API_ORIGIN in prod (Vercel) a "https://api.davveroo.it"
const ORIGIN = (import.meta.env.VITE_API_ORIGIN || 'https://api.davveroo.it').replace(/\/+$/,'');
const API_BASE = `${ORIGIN}/api`;

const join = (p) => `${API_BASE}/${String(p).replace(/^\/+/, '')}`;

async function handle(r){
  if(!r.ok){
    const t = await r.text().catch(()=> '');
    throw new Error(`HTTP ${r.status} @ ${r.url} ${t || r.statusText}`);
  }
  return r.json();
}

export async function apiGet(path){
  const token = getToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  return handle(await fetch(join(path), { cache:'no-store', headers }));
}

export async function apiPost(path, body, headers = {}){
  const token = getToken();
  const auth = token ? { Authorization: `Bearer ${token}` } : {};
  return handle(await fetch(join(path), {
    method:'POST',
    headers: { 'Content-Type':'application/json', ...auth, ...headers },
    body: JSON.stringify(body)
  }));
}

// Helpers auth
export const apiAuth = {
  login(email, password, selectedRoles = []) {
    return apiPost('auth/login', { email, password, roles: selectedRoles });
  },
  register(payload) {
    return apiPost('auth/register', payload);
  }
}; 