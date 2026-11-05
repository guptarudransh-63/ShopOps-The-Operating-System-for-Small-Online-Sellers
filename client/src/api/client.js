import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach active workspace id if stored
api.interceptors.request.use((config) => {
  const activeBusinessId = localStorage.getItem('shopops_business_id');
  if (activeBusinessId) {
    config.headers['x-business-id'] = activeBusinessId;
  }
  return config;
});

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If 401 Unauthorized, notify or clear session if needed
    if (error.response?.status === 401 && !window.location.pathname.startsWith('/login')) {
      // Don't auto-redirect if already checking /auth/me
      if (!error.config.url.includes('/auth/me')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
