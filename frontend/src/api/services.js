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

export const fetchServices = async (workerId) => {
  const { data } = await api.get(`/services?worker_id=${workerId}`);
  return data;
};

export const createService = async (serviceData) => {
  const { data } = await api.post('/services', serviceData);
  return data;
};

export const updateService = async ({ serviceId, serviceData }) => {
  const { data } = await api.put(`/services/${serviceId}`, serviceData);
  return data;
};

export const deleteService = async (serviceId) => {
  const { data } = await api.delete(`/services/${serviceId}`);
  return data;
}; 