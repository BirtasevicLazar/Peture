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

export const fetchWorkers = async () => {
  const { data } = await api.get('/workers');
  return data;
};

export const createWorker = async (formData) => {
  const { data } = await api.post('/workers', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

export const fetchWorkerById = async (workerId) => {
  const { data } = await api.get(`/workers/${workerId}`);
  return data;
};

export const updateWorker = async ({ workerId, formData }) => {
  const { data } = await api.post(`/workers/${workerId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      'Accept': 'application/json'
    }
  });
  return data;
};

export const deleteWorker = async (workerId) => {
  const { data } = await api.delete(`/workers/${workerId}`);
  return data;
}; 