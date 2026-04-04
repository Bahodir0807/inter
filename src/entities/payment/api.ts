import { http } from '../../shared/api/http';
import { AppUser } from '../../shared/types/auth';
import { Course } from '../course/api';

export interface Payment {
  id: string;
  amount: number;
  paidAt?: string;
  isConfirmed: boolean;
  student?: AppUser | string;
  course?: Course | string;
  createdAt?: string;
}

export interface PaymentFormValues {
  student: string;
  courseId: string;
  paidAt?: string;
}

export const paymentsApi = {
  async getAll() {
    const { data } = await http.get<Payment[]>('/payments');
    return data;
  },
  async getMine() {
    const { data } = await http.get<Payment[]>('/payments/me');
    return data;
  },
  async create(payload: PaymentFormValues) {
    const { data } = await http.post<Payment>('/payments', payload);
    return data;
  },
  async confirm(id: string) {
    const { data } = await http.patch<Payment>(`/payments/${id}/confirm`);
    return data;
  },
  async remove(id: string) {
    await http.delete(`/payments/${id}`);
  },
};
