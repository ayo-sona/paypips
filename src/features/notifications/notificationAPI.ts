import apiClient from '../../lib/apiClient';
import { Notification } from '../../types/notification';

export const notificationAPI = {
  async getAll(): Promise<Notification[]> {
    try {
      // TODO: Implement when backend has notification endpoints
      // const response = await apiClient.get('/notifications');
      // return response.data.data;
      
      // For now, return empty array (no notifications)
      return [];
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      return [];
    }
  },

  async markAsRead(notificationId: string): Promise<void> {
    try {
      // TODO: Implement when backend has notification endpoints
      // await apiClient.put(`/notifications/${notificationId}/read`);
      console.log('Mark as read:', notificationId);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  },

  async markAllAsRead(): Promise<void> {
    try {
      // TODO: Implement when backend has notification endpoints
      // await apiClient.put('/notifications/read-all');
      console.log('Mark all as read');
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  },

  async delete(notificationId: string): Promise<void> {
    try {
      // TODO: Implement when backend has notification endpoints
      // await apiClient.delete(`/notifications/${notificationId}`);
      console.log('Delete notification:', notificationId);
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  },
};