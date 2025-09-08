// src/lib/auth.js
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user'; // stores { id, name, email, roles: string[] }

export function getToken() {
  try { return localStorage.getItem(TOKEN_KEY) || ''; } catch { return ''; }
}

export function setToken(t) {
  try {
    if (t) localStorage.setItem(TOKEN_KEY, t); else localStorage.removeItem(TOKEN_KEY);
  } catch {}
}

export function getUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    const u = JSON.parse(raw);
    if (u && Array.isArray(u.roles)) return u;
    return null;
  } catch { return null; }
}

export function setUser(u) {
  try {
    if (u) localStorage.setItem(USER_KEY, JSON.stringify(u)); else localStorage.removeItem(USER_KEY);
  } catch {}
}

export function isLoggedIn() {
  return !!getToken();
}

export function hasRole(role) {
  const u = getUser();
  return !!u && Array.isArray(u.roles) && u.roles.includes(role);
}

export function hasAnyRole(roles) {
  const u = getUser();
  if (!u || !Array.isArray(u.roles)) return false;
  return roles.some(r => u.roles.includes(r));
}

export function clearAuth() {
  setToken('');
  setUser(null);
}

// Helpers for default navigation
export function defaultHome() {
  const u = getUser();
  if (!u) return '/login';
  if (u.roles.includes('admin') || u.roles.includes('seller')) return '/dashboard';
  return '/account';
}

