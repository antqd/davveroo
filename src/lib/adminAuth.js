const KEY = 'Expo2026@@';

export function getAdminToken() {
  try { return localStorage.getItem(KEY) || ''; } catch { return ''; }
}
export function setAdminToken(t) {
  try { t ? localStorage.setItem(KEY, t) : localStorage.removeItem(KEY); } catch {}
}
export function clearAdminToken() { setAdminToken(''); }