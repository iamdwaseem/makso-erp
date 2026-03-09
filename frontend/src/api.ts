import axios from 'axios';

const api = axios.create({
  // Use VITE_API_URL if defined (e.g., local dev), otherwise fallback to '/api'
  // for production where Nginx handles routing /api to the backend.
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach the JWT token to every outgoing request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('wareflow_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If the server returns 401, clear local session so the user gets redirected
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('wareflow_token');
      localStorage.removeItem('wareflow_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
