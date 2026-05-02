// store/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/utils/api';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'patient' | 'doctor' | 'admin';
  avatar?: string;
  avatarUrl?: string;
  isEmailVerified: boolean;
  phone?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
  clearError: () => void;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  role?: string;
  phone?: string;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await api.post('/auth/login', { email, password });
          set({ user: data.user, token: data.token, isLoading: false });
          api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
        } catch (err: any) {
          set({ isLoading: false, error: err.response?.data?.message || 'Login failed' });
          throw err;
        }
      },

      register: async (registerData) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await api.post('/auth/register', registerData);
          set({ user: data.user, token: data.token, isLoading: false });
          api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
        } catch (err: any) {
          set({ isLoading: false, error: err.response?.data?.message || 'Registration failed' });
          throw err;
        }
      },

      logout: async () => {
        try { await api.post('/auth/logout'); } catch {}
        delete api.defaults.headers.common['Authorization'];
        set({ user: null, token: null });
      },

      fetchMe: async () => {
        const token = get().token;
        if (!token) return;
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        try {
          const { data } = await api.get('/auth/me');
          set({ user: data.user });
        } catch {
          set({ user: null, token: null });
        }
      },

      updateUser: (data) => set(state => ({ user: state.user ? { ...state.user, ...data } : null })),
      clearError: () => set({ error: null })
    }),
    {
      name: 'healing-auth',
      partialize: (state) => ({ token: state.token, user: state.user })
    }
  )
);
