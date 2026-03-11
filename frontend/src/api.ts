import axios from 'axios';

const api = axios.create({
  // Use VITE_API_URL if defined (e.g., local dev), otherwise fallback to '/api'
  // for production where Nginx handles routing /api to the backend.
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

import { useWarehouseStore } from './store/warehouseStore';

// Attach the JWT token and current warehouseId to every outgoing request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('wareflow_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
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

// If the server returns 401, clear local session so the user gets redirected
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = String(error.response?.data?.error || "").toLowerCase();
    const isAuthStateError =
      status === 401 ||
      (status === 403 && message.includes("tenant mismatch")) ||
      (status === 403 && message.includes("organization context mismatch"));

    if (isAuthStateError) {
      localStorage.removeItem('wareflow_token');
      localStorage.removeItem('wareflow_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
