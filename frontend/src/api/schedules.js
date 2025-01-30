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

export const fetchSchedules = async (workerId) => {
  const { data } = await api.get(`/work-schedules?worker_id=${workerId}`);
  return data.filter(schedule => schedule.worker_id === workerId);
};

export const createSchedule = async (scheduleData) => {
  const { data } = await api.post('/work-schedules', scheduleData);
  return data;
};

export const updateSchedule = async ({ scheduleId, scheduleData }) => {
  const { data } = await api.put(`/work-schedules/${scheduleId}`, scheduleData);
  return data;
}; 