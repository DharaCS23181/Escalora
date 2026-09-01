import { create } from 'zustand';

export interface User {
  id: string;
  full_name: string;
  email: string;
  role: 'ADMIN' | 'PROJECT_LEAD' | 'SENIOR_DEVELOPER' | 'DEVELOPER';
  status: 'ACTIVE' | 'PENDING' | 'INACTIVE';
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  setLoading: (isLoading: boolean) => void;
}

const getStoredToken = () => localStorage.getItem('escalora_token');
const getStoredUser = (): User | null => {
  const user = localStorage.getItem('escalora_user');
  return user ? JSON.parse(user) : null;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: getStoredUser(),
  token: getStoredToken(),
  isAuthenticated: !!getStoredToken(),
  isLoading: false,

  setAuth: (user, token) => {
    localStorage.setItem('escalora_token', token);
    localStorage.setItem('escalora_user', JSON.stringify(user));
    set({ user, token, isAuthenticated: true });
  },

  clearAuth: () => {
    localStorage.removeItem('escalora_token');
    localStorage.removeItem('escalora_user');
    set({ user: null, token: null, isAuthenticated: false });
  },

  setLoading: (isLoading) => set({ isLoading }),
}));
