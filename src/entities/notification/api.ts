import { http } from '../../shared/api/http';

export type NotificationType = 'payment' | 'homework' | 'grades' | 'attendance' | 'general';

export interface NotificationFormValues {
  userId: string;
  message: string;
  type: NotificationType;
}

export const notificationsApi = {
  async send(payload: NotificationFormValues) {
    const { data } = await http.post('/notifications', payload);
    return data;
  },
};
