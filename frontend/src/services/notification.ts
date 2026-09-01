import { apiClient } from './api';

export interface Notification {
  id: string;
  recipient_id: string;
  actor_id: string | null;
  type: string;
  title: string;
  message: string;
  ticket_id: string | null;
  project_id: string | null;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
}

export const notificationService = {
  getNotifications: async (skip = 0, limit = 50): Promise<Notification[]> => {
    const response = await apiClient.get('/notifications', { params: { skip, limit } });
    return response.data;
  },

  getUnreadCount: async (): Promise<number> => {
    const response = await apiClient.get('/notifications/unread-count');
    return response.data.count;
  },

  markAsRead: async (id: string): Promise<Notification> => {
    const response = await apiClient.patch(`/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async (): Promise<void> => {
    await apiClient.patch('/notifications/read-all');
  },
};
