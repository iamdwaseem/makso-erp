import axios from 'axios';

function resolveApiBase(): string {
  const fromEnv = import.meta.env.VITE_API_URL as string | undefined;
  if (fromEnv && String(fromEnv).trim()) return String(fromEnv).replace(/\/$/, '');
  // Dev: same-origin /api → Vite proxy to backend (avoids CORS and port mismatch).
  if (import.meta.env.DEV) return '/api';
  return '/api';
}

const api = axios.create({
  baseURL: resolveApiBase(),
  headers: {
    'Content-Type': 'application/json',
  },
});

import { useWarehouseStore } from './store/warehouseStore';

function isPublicAuthPath(url: string): boolean {
  const p = url.replace(/^\//, '').split('?')[0];
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
  const isWarehouseAware = warehouseAwarePathPrefixes.some((prefix) => requestPath.startsWith(prefix));

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
