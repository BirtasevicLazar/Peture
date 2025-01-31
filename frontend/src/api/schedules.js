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

// Cache za rasporede
const scheduleCache = new Map();

export const fetchSchedules = async (workerId) => {
  // Proveri cache
  const cacheKey = `schedules-${workerId}`;
  const cachedData = scheduleCache.get(cacheKey);
  
  if (cachedData) {
    const { data, timestamp } = cachedData;
    // Cache je validan 5 minuta
    if (Date.now() - timestamp < 5 * 60 * 1000) {
      return data;
    }
    scheduleCache.delete(cacheKey);
  }

  const response = await api.get(`/work-schedules`, {
    params: { worker_id: workerId }
  });
  
  // Sačuvaj u cache
  scheduleCache.set(cacheKey, {
    data: response.data,
    timestamp: Date.now()
  });
  
  return response.data;
};

export const createSchedule = async (scheduleData) => {
  const response = await api.post('/work-schedules', scheduleData);
  // Invalidate cache nakon kreiranja
  scheduleCache.delete(`schedules-${scheduleData.worker_id}`);
  return response.data;
};

export const updateSchedule = async ({ scheduleId, scheduleData }) => {
  const response = await api.put(`/work-schedules/${scheduleId}`, scheduleData);
  // Invalidate cache nakon ažuriranja
  scheduleCache.delete(`schedules-${scheduleData.worker_id}`);
  return response.data;
}; 