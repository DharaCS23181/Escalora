import { apiClient } from './api';
import { useAuthStore } from '../store/authStore';
import type { User } from '../store/authStore';

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export const authService = {
  login: async (email: string, password: string): Promise<User> => {
    const response = await apiClient.post<LoginResponse>('/auth/login', {
      email,
      password,
    });
    const { access_token, user } = response.data;
    useAuthStore.getState().setAuth(user, access_token);
    return user;
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout');
    } catch (e) {
      console.warn('Logout API failed, proceeding with local logout', e);
    } finally {
      useAuthStore.getState().clearAuth();
      window.location.href = '/login';
    }
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get<User>('/auth/me');
    const user = response.data;
    // update local state
    const currentToken = useAuthStore.getState().token;
    if (currentToken) {
      useAuthStore.getState().setAuth(user, currentToken);
    }
    return user;
  },
};
