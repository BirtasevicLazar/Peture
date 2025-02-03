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
  // Ako je FormData objekat, dodaj _method=PUT
  if (formData instanceof FormData) {
    formData.append('_method', 'PUT');
  } else {
    // Ako je običan objekat, kreiraj novi FormData
    const newFormData = new FormData();
    for (let key in formData) {
      if (formData[key] !== undefined && formData[key] !== null) {
        if (key === 'profile_image' && formData[key] instanceof File) {
          newFormData.append(key, formData[key], formData[key].name);
        } else {
          newFormData.append(key, formData[key]);
        }
      }
    }
    newFormData.append('_method', 'PUT');
    formData = newFormData;
  }

  const { data } = await api.post(`/workers/${workerId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      'Accept': 'application/json'
    }
  });
  
  return data.worker;
};

export const deleteWorker = async (workerId) => {
  const { data } = await api.delete(`/workers/${workerId}`);
  return data;
}; 