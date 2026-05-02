// utils/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
});

// Request interceptor - attach token
api.interceptors.request.use(
  (config) => {
    const state = JSON.parse(localStorage.getItem('healing-auth') || '{}');
    const token = state?.state?.token;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('healing-auth');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// ─── API Functions ────────────────────────────────────────────────────────────
export const doctorApi = {
  getAll: (params?: Record<string, any>) => api.get('/doctors', { params }),
  getOne: (id: string) => api.get(`/doctors/${id}`),
  getMe: () => api.get('/doctors/me'),                                        // NEW
  getFeatured: () => api.get('/doctors/featured'),
  getSpecializations: () => api.get('/doctors/specializations'),
  getConditions: () => api.get('/doctors/conditions'),                        // NEW
  getAvailability: (id: string, date: string) => api.get(`/doctors/${id}/availability`, { params: { date } }),
  create: (data: any) => api.post('/doctors', data),
  update: (id: string, data: any) => api.put(`/doctors/${id}`, data),
};

export const appointmentApi = {
  getAll: (params?: Record<string, any>) => api.get('/appointments', { params }),
  getOne: (id: string) => api.get(`/appointments/${id}`),
  getUpcoming: () => api.get('/appointments/upcoming'),
  create: (data: any) => api.post('/appointments', data),
  updateStatus: (id: string, data: any) => api.patch(`/appointments/${id}/status`, data),
  reschedule: (id: string, data: any) => api.put(`/appointments/${id}/reschedule`, data),
  addNotes: (id: string, data: any) => api.patch(`/appointments/${id}/notes`, data),
};

export const reviewApi = {
  getDoctorReviews: (doctorId: string, params?: any) => api.get(`/reviews/doctor/${doctorId}`, { params }),
  create: (data: any) => api.post('/reviews', data),
  addResponse: (id: string, data: any) => api.put(`/reviews/${id}/response`, data),
  delete: (id: string) => api.delete(`/reviews/${id}`),
};

export const paymentApi = {
  createIntent: (appointmentId: string) => api.post('/payments/create-intent', { appointmentId }),
  getHistory: () => api.get('/payments/history'),
};

export const prescriptionApi = {
  getAll: () => api.get('/prescriptions'),
  getOne: (id: string) => api.get(`/prescriptions/${id}`),
  create: (data: any) => api.post('/prescriptions', data),
};

export const videoApi = {
  createRoom: (appointmentId: string) => api.post('/video/create-room', { appointmentId }),
  getToken: (appointmentId: string) => api.get(`/video/token/${appointmentId}`),
};

export const adminApi = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (params?: any) => api.get('/admin/users', { params }),
  toggleUserActive: (id: string) => api.patch(`/admin/users/${id}/toggle-active`),
  verifyDoctor: (id: string, isVerified: boolean) => api.put(`/admin/doctors/${id}/verify`, { isVerified }),
};
