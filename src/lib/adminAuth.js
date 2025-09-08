// src/lib/adminAuth.js
const KEY = 'davveroo_admin_token'; // è il NOME della chiave su localStorage, NON il token

export function getAdminToken() {
  try {
    return localStorage.getItem(KEY) || '';
  } catch {
    return '';
  }
}

export function setAdminToken(t) {
  try {
    if (t && String(t).trim()) {
      localStorage.setItem(KEY, String(t).trim());
    } else {
      localStorage.removeItem(KEY);
    }
  } catch {}
}

export function clearAdminToken() {
  setAdminToken('');
}