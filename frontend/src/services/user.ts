import { apiClient } from './api';
import type { User } from '../store/authStore';

export interface UserInviteData {
  full_name: string;
  email: string;
  role: string;
}

export interface UserUpdateData {
  full_name?: string;
  email?: string;
  role?: string;
}

export const userService = {
  getUsers: async (): Promise<User[]> => {
    const response = await apiClient.get('/users');
    return response.data;
  },

  getUser: async (id: string): Promise<User> => {
    const response = await apiClient.get(`/users/${id}`);
    return response.data;
  },

  inviteUser: async (data: UserInviteData): Promise<User> => {
    const response = await apiClient.post('/users/invite', data);
    return response.data;
  },

  resendInvite: async (id: string): Promise<void> => {
    await apiClient.post(`/users/${id}/resend-invite`);
  },

  updateUser: async (id: string, data: UserUpdateData): Promise<User> => {
    const response = await apiClient.patch(`/users/${id}`, data);
    return response.data;
  },

  updateUserStatus: async (id: string, status: string): Promise<User> => {
    const response = await apiClient.patch(`/users/${id}/status`, { status });
    return response.data;
  }
};
