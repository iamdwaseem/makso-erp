import axios from 'axios';

/** True if this cannot work from a real user’s browser in production (causes CORS / wrong host). */
function isLocalhostApiUrl(url: string): boolean {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(\b|\/|:)/i.test(url);
}

/**
 * API base URL for axios.
 * - Dev: prefer Vite proxy via same-origin `/api` unless you set a non-local override (e.g. LAN IP).
 * - Prod: use `VITE_API_URL` only when it is a real deployed origin (e.g. `https://api.example.com` or `/api`).
 *   Values like `http://localhost:4000` are ignored so production never calls localhost (fixes CORS on DO, etc.).
 */
function resolveApiBase(): string {
  const raw = String(import.meta.env.VITE_API_URL ?? "").trim().replace(/\/$/, "");

  if (import.meta.env.DEV) {
    if (raw && !isLocalhostApiUrl(raw)) return raw;
    return "/api";
  }

  if (raw && !isLocalhostApiUrl(raw)) return raw;

  if (raw && isLocalhostApiUrl(raw)) {
    console.warn(
      "[api] VITE_API_URL targets localhost in a production build; using same-origin /api (set /api or your public API URL in the Docker build)."
    );
  }

  return "/api";
}

const api = axios.create({
  baseURL: resolveApiBase(),
  headers: {
    'Content-Type': 'application/json',
  },
});

import { useWarehouseStore } from './store/warehouseStore';

function isPublicAuthPath(url: string): boolean {
  if (!url) return false;
  let path = url;
  if (url.startsWith('http')) {
    try {
      path = new URL(url).pathname;
    } catch {
      /* ignore */
    }
  }
  const p = path.replace(/^\//, '').split('?')[0];
  return p === 'auth/login' || p === 'auth/register';
}

// Attach JWT for protected calls only (never send stale Bearer on login/register)
api.interceptors.request.use((config) => {
  const rel = config.url || '';
  if (!isPublicAuthPath(rel)) {
    const token = localStorage.getItem('wareflow_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  // Inject warehouse scope only for endpoints that are warehouse-aware.
  const warehouseAwarePathPrefixes = [
    '/inventory',
    '/purchases',
    '/sales',
    '/scan',
    '/dashboard',
    '/history',
  ];
  const requestPath = config.url || '';
  const isWarehouseAware =
    warehouseAwarePathPrefixes.some((prefix) => requestPath.startsWith(prefix)) &&
    // Transfers move stock between warehouses; do not scope these calls to a single warehouse.
    !requestPath.startsWith('/inventory/transfers');

  const warehouseId = useWarehouseStore.getState().currentWarehouseId;
  if (isWarehouseAware && warehouseId && warehouseId !== 'all') {
    config.params = {
      ...config.params,
      warehouseId,
    };
  }

  return config;
});

// On 401/403 from protected APIs, clear session and send user to login (not on failed login/register)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = String(error.config?.url || "");
    const isLoginOrRegister = url.includes("auth/login") || url.includes("auth/register");
    const status = error.response?.status;
    const message = String(error.response?.data?.error || "").toLowerCase();
    const isAuthStateError =
      status === 401 ||
      (status === 403 && message.includes("tenant mismatch")) ||
      (status === 403 && message.includes("organization context mismatch"));

    if (isAuthStateError && !isLoginOrRegister) {
      localStorage.removeItem('wareflow_token');
      localStorage.removeItem('wareflow_user');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
