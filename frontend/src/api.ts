import axios from 'axios';

const api = axios.create({
  baseURL: 'http://192.168.1.7:4000/api',
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
