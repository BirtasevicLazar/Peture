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

export const fetchSalonData = async () => {
  const { data } = await api.get('/user');
  if (data.salon_image) {
    data.salon_image = `${import.meta.env.VITE_API_URL}/storage/${data.salon_image}`;
  }
  return data;
};

export const updateSalonDetails = async (formData) => {
  const { data } = await api.post('/user/update', formData, {
    headers: { 
      'Content-Type': 'multipart/form-data',
      'Accept': 'application/json'
    }
  });

  if (data.user.salon_image) {
    data.user.salon_image = `${import.meta.env.VITE_API_URL}/storage/${data.user.salon_image}`;
  }

  return data.user;
}; 