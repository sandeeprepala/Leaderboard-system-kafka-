import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000', // Points to API Gateway on port 8000
  headers: {
    'Content-Type': 'application/json'
  }
});

// Fallback: Attach token from localStorage if cookies are not set or active
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;
