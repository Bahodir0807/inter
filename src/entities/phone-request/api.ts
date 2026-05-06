import { http } from '../../shared/api/http';
import { ListQueryParams, PaginatedList } from '../../shared/types/api';

export type PhoneRequestStatus = 'pending' | 'approved' | 'rejected';

export interface PhoneRequest {
  id: string;
  phone: string;
  name: string;
  telegramId: string;
  status: PhoneRequestStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface PhoneRequestFormValues {
  phone: string;
  name: string;
  telegramId: string;
}

export interface PhoneRequestListParams extends ListQueryParams {
  telegramId?: string;
  status?: PhoneRequestStatus;
}

export const phoneRequestsApi = {
  async create(payload: PhoneRequestFormValues) {
    const { data } = await http.post<PhoneRequest>('/phone-request', payload);
    return data;
  },
  async getPublicStatus(telegramId: string) {
    const { data } = await http.get<PhoneRequest>('/phone-request', { params: { telegramId } });
    return data;
  },
  async createFromTelegram(payload: PhoneRequestFormValues) {
    const { data } = await http.post<PhoneRequest>('/phone-request/tg-request', payload);
    return data;
  },
  async checkFromTelegram(telegramId: string) {
    const { data } = await http.get<PhoneRequest>('/phone-request/tg-check', { params: { telegramId } });
    return data;
  },
  async getPending(params?: PhoneRequestListParams): Promise<PaginatedList<PhoneRequest>> {
    const response = await http.get<PhoneRequest[]>('/phone-request/pending', { params });
    return { items: response.data, pagination: response.apiMeta?.pagination };
  },
  async handle(requestId: string, status: Exclude<PhoneRequestStatus, 'pending'>) {
    const { data } = await http.patch<PhoneRequest>('/phone-request', { requestId, status });
    return data;
  },
};
