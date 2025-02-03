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

export const fetchWorkerOffDays = async (workerId) => {
  const { data } = await api.get(`/workers/${workerId}/off-days`);
  return data.off_days;
};

export const createWorkerOffDays = async (offDayData) => {
  const { data } = await api.post(`/workers/${offDayData.workerId}/off-days`, {
    start_date: offDayData.start_date,
    end_date: offDayData.end_date,
    reason: offDayData.reason
  });
  return data;
};

export const deleteWorkerOffDay = async ({ workerId, offDayId }) => {
  const { data } = await api.delete(`/workers/${workerId}/off-days/${offDayId}`);
  return data;
}; 