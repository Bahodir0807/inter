import { http } from '../../shared/api/http';
import { ListQueryParams, PaginatedList } from '../../shared/types/api';

export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'debt' | 'frozen' | 'overpaid';

export interface PaymentHistory {
  amount: number;
  paidAt: string;
  paymentMethod: 'cash' | 'card' | 'transfer';
  comment?: string;
  createdBy: string;
}

export interface Payment {
  id: string;
  studentId: string;
  courseId: string;
  groupId: string;
  branchId: string;
  month: number;
  year: number;
  paymentPeriod: string; // e.g. "2026-05"
  expectedAmount: number;
  paidAmount: number;
  remainingAmount: number;
  overpaidAmount: number;
  status: PaymentStatus;
  isFrozen: boolean;
  freezeReason?: string;
  freezeFrom?: string;
  freezeTo?: string;
  comment?: string;
  paymentHistory: PaymentHistory[];
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentFormValues {
  studentId: string;
  courseId: string;
  groupId: string;
  branchId: string;
  month: number;
  year: number;
  expectedAmount: number;
  paidAmount: number;
  paymentMethod?: 'cash' | 'card' | 'transfer';
  comment?: string;
}

export interface AddPaymentFormValues {
  amount: number;
  method: 'cash' | 'card' | 'transfer';
  comment?: string;
}

export interface PaymentsListParams extends ListQueryParams {
  studentId?: string;
  courseId?: string;
  groupId?: string;
  branchId?: string;
  status?: PaymentStatus;
}

export interface PaymentReportsSummaryFilters {
  branchId?: string;
  courseId?: string;
  year?: number;
  month?: number;
  status?: PaymentStatus;
}

export interface PaymentReportsSummary {
  totalExpectedAmount: number;
  totalPaidAmount: number;
  totalRemainingAmount: number;
  totalOverpaidAmount: number;
  totalDebtAmount: number;
  totalPaymentsCount: number;
  paidCount: number;
  partialCount: number;
  pendingCount: number;
  debtCount: number;
  frozenCount: number;
  overpaidCount: number;
}

export interface PaymentDebtorsFilters extends PaymentReportsSummaryFilters {
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaymentDebtor {
  paymentId: string;
  studentId: string;
  studentNumber: string;
  studentName: string;
  phone?: string | null;
  parentPhone?: string | null;
  courseId: string;
  courseName: string;
  groupId?: string | null;
  groupName?: string | null;
  branchId?: string | null;
  branchName: string | null;
  expectedAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: PaymentStatus;
  dueDate: string;
  year: number;
  month: number;
}

export const paymentsApi = {
  async getAll(params?: PaymentsListParams) {
    const { data } = await http.get<Payment[]>('/payments', { params });
    return data;
  },

  async getAllPage(params?: PaymentsListParams): Promise<PaginatedList<Payment>> {
    const response = await http.get<PaginatedList<Payment>>('/payments', { params });
    return { items: response.data.items || [], pagination: response.apiMeta?.pagination };
  },

  async getMine(params?: PaymentsListParams) {
    const { data } = await http.get<Payment[]>('/payments/me', { params });
    return data;
  },

  async getMinePage(params?: PaymentsListParams): Promise<PaginatedList<Payment>> {
    const response = await http.get<PaginatedList<Payment>>('/payments/me', { params });
    return { items: response.data.items || [], pagination: response.apiMeta?.pagination };
  },

  async getByStudent(studentId: string, params?: PaymentsListParams) {
    const { data } = await http.get<Payment[]>(`/payments/student/${studentId}`, { params });
    return data;
  },

  async getByStudentPage(studentId: string, params?: PaymentsListParams): Promise<PaginatedList<Payment>> {
    const response = await http.get<PaginatedList<Payment>>(`/payments/student/${studentId}`, { params });
    return { items: response.data.items || [], pagination: response.apiMeta?.pagination };
  },

  async getById(id: string) {
    const { data } = await http.get<Payment>(`/payments/${id}`);
    return data;
  },

  async create(payload: CreatePaymentFormValues) {
    const { data } = await http.post<Payment>('/payments', payload);
    return data;
  },

  async addPayment(id: string, payload: AddPaymentFormValues) {
    const { data } = await http.post<Payment>(`/payments/${id}/add-payment`, payload);
    return data;
  },

  async freeze(id: string, reason: string, freezeFrom?: Date, freezeTo?: Date) {
    const { data } = await http.patch<Payment>(`/payments/${id}/freeze`, {
      reason,
      freezeFrom,
      freezeTo,
    });
    return data;
  },

  async unfreeze(id: string) {
    const { data } = await http.patch<Payment>(`/payments/${id}/unfreeze`);
    return data;
  },

  async update(id: string, payload: Partial<CreatePaymentFormValues>) {
    const { data } = await http.patch<Payment>(`/payments/${id}`, payload);
    return data;
  },

  async remove(id: string) {
    await http.delete(`/payments/${id}`);
  },

  async getStatistics(branchId?: string) {
    const params = branchId ? { branchId } : {};
    const { data } = await http.get('/payments/statistics/summary', { params });
    return data;
  },

  async getPaymentReportsSummary(params?: PaymentReportsSummaryFilters) {
    const { data } = await http.get<PaymentReportsSummary>('/payments/reports/summary', { params });
    return data;
  },

  async getPaymentDebtors(params?: PaymentDebtorsFilters): Promise<PaginatedList<PaymentDebtor>> {
    const response = await http.get<PaginatedList<PaymentDebtor>>('/payments/reports/debtors', { params });
    return { items: response.data.items || [], pagination: response.apiMeta?.pagination ?? response.data.pagination };
  },
};
