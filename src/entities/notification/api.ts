import { http } from '../../shared/api/http';
import { ListQueryParams, PaginatedList } from '../../shared/types/api';

export type NotificationType = 'general' | 'homework' | 'schedule' | 'payment';

export interface SendNotificationPayload {
  userId: string;
  type: NotificationType;
  message: string;
}

export type NotificationDeliveryStatus =
  | 'skipped'
  | 'pending'
  | 'sent'
  | 'failed'
  | 'dry_run';
export type NotificationDeliveryType = 'debt_sms';
export type NotificationDeliveryChannel = 'sms';
export type NotificationDeliveryRecipientType = 'student' | 'parent';

export interface NotificationDelivery {
  id: string;
  type: NotificationDeliveryType;
  channel: NotificationDeliveryChannel;
  paymentId: string;
  studentId: string;
  studentName?: string;
  studentNumber?: string;
  recipientType: NotificationDeliveryRecipientType;
  phone: string;
  message: string;
  status: NotificationDeliveryStatus;
  providerMessageId?: string;
  error?: string;
  dateKey: string;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  sentAt?: string;
}

export interface NotificationDeliveryFilters extends ListQueryParams {
  type?: NotificationDeliveryType;
  channel?: NotificationDeliveryChannel;
  status?: NotificationDeliveryStatus;
  branchId?: string;
  courseId?: string;
  studentId?: string;
  paymentId?: string;
  recipientType?: NotificationDeliveryRecipientType;
  phone?: string;
  dateFrom?: string;
  dateTo?: string;
}

export const notificationsApi = {
  async send(payload: SendNotificationPayload) {
    const { data } = await http.post('/notifications', payload);
    return data;
  },
  async getDeliveries(
    params?: NotificationDeliveryFilters,
  ): Promise<PaginatedList<NotificationDelivery>> {
    const response = await http.get<PaginatedList<NotificationDelivery>>(
      '/notifications/deliveries',
      { params },
    );
    return {
      items: response.data.items || [],
      pagination: response.apiMeta?.pagination ?? response.data.pagination,
    };
  },
};
