const API_BASE = 'https://api.davveroo.it';

const join = (p) => `${API_BASE}/${String(p).replace(/^\/+/, '')}`;

async function handle(r){
  if (!r.ok) {
    const t = await r.text().catch(()=> '');
    throw new Error(`HTTP ${r.status} - ${t || r.statusText}`);
  }
  return r.json();
}

export async function apiGet(path){ return handle(await fetch(join(path), { cache:'no-store' })); }
export async function apiPost(path, body, headers = {}){
  return handle(await fetch(join(path), {
    method:'POST',
    headers: { 'Content-Type':'application/json', ...headers },
    body: JSON.stringify(body),
  }));
}