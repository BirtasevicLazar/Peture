import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Interceptor za dodavanje auth tokena
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const checkAuth = async () => {
  const { data } = await api.get('/check-auth', {
    headers: { 'Accept': 'application/json' }
  });
  return data;
};

export const checkWorkers = async () => {
  const { data } = await api.get('/workers');
  return data;
}; 