const getDefaultApiUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // If accessing from a local network IP (e.g. 172.26.80.1:5173), target the same host on backend port 4000
  if (typeof window !== 'undefined' && window.location.hostname) {
    return `http://${window.location.hostname}:4000/api`;
  }
  return 'http://localhost:4000/api';
};

const API = getDefaultApiUrl();
let token = localStorage.getItem('planner_token');

export const setToken = (value: string | null) => {
  token = value;
  if (value) {
    localStorage.setItem('planner_token', value);
  } else {
    localStorage.removeItem('planner_token');
  }
};

export const getToken = () => token;

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(`${API}${path}`, { ...options, headers });
  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return body as T;
}

export const apiBase = API;
