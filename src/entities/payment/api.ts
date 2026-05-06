import { http } from '../../shared/api/http';
import { ListQueryParams, PaginatedList } from '../../shared/types/api';
import { AppUser } from '../../shared/types/auth';
import { Course } from '../course/api';

export type PaymentStatus = 'pending' | 'confirmed' | 'cancelled';

export interface Payment {
  id: string;
  amount: number;
  paidAt?: string;
  status: PaymentStatus;
  student?: AppUser | string;
  course?: Course | string;
  courseId?: Course | string;
  method?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaymentFormValues {
  student: string;
  courseId: string;
  method?: string;
  paidAt?: string;
}

export interface PaymentsListParams extends ListQueryParams {
  studentId?: string;
  courseId?: string;
  status?: PaymentStatus;
}

export const paymentsApi = {
  async getAll(params?: PaymentsListParams) {
    const { data } = await http.get<Payment[]>('/payments', { params });
    return data;
  },
  async getAllPage(params?: PaymentsListParams): Promise<PaginatedList<Payment>> {
    const response = await http.get<Payment[]>('/payments', { params });
    return { items: response.data, pagination: response.apiMeta?.pagination };
  },
  async getMine(params?: PaymentsListParams) {
    const { data } = await http.get<Payment[]>('/payments/me', { params });
    return data;
  },
  async getMinePage(params?: PaymentsListParams): Promise<PaginatedList<Payment>> {
    const response = await http.get<Payment[]>('/payments/me', { params });
    return { items: response.data, pagination: response.apiMeta?.pagination };
  },
  async getByStudent(studentId: string, params?: PaymentsListParams) {
    const { data } = await http.get<Payment[]>(`/payments/student/${studentId}`, { params });
    return data;
  },
  async getByStudentPage(studentId: string, params?: PaymentsListParams): Promise<PaginatedList<Payment>> {
    const response = await http.get<Payment[]>(`/payments/student/${studentId}`, { params });
    return { items: response.data, pagination: response.apiMeta?.pagination };
  },
  async create(payload: PaymentFormValues) {
    const { data } = await http.post<Payment>('/payments', payload);
    return data;
  },
  async confirm(id: string) {
    const { data } = await http.patch<Payment>(`/payments/${id}/confirm`);
    return data;
  },
  async cancel(id: string) {
    const { data } = await http.patch<Payment>(`/payments/${id}/cancel`);
    return data;
  },
  async remove(id: string) {
    await http.delete(`/payments/${id}`);
  },
};
