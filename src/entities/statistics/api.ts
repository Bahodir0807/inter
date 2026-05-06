import { http } from '../../shared/api/http';
import { ListQueryParams, PaginatedList } from '../../shared/types/api';

export interface Statistic {
  id: string;
  date: string;
  type: string;
  value: number;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface StatisticFormValues {
  date: string;
  type: string;
  value: number;
  metadata?: Record<string, unknown>;
}

export interface StatisticsListParams extends ListQueryParams {
  type?: string;
  branchId?: string;
  teacherId?: string;
  studentId?: string;
  groupId?: string;
}

export const statisticsApi = {
  async getAll(params?: StatisticsListParams): Promise<Statistic[]> {
    const { data } = await http.get<Statistic[]>('/statistics', { params });
    return data;
  },
  async getAllPage(params?: StatisticsListParams): Promise<PaginatedList<Statistic>> {
    const response = await http.get<Statistic[]>('/statistics', { params });
    return { items: response.data, pagination: response.apiMeta?.pagination };
  },
  async getByType(type: string, params?: StatisticsListParams) {
    const response = await http.get<Statistic[]>(`/statistics/${type}`, { params });
    return { items: response.data, pagination: response.apiMeta?.pagination };
  },
  async create(payload: StatisticFormValues) {
    const { data } = await http.post<Statistic>('/statistics', payload);
    return data;
  },
  async update(id: string, payload: Partial<Pick<StatisticFormValues, 'value' | 'metadata'>>) {
    const { data } = await http.patch<Statistic>(`/statistics/${id}`, payload);
    return data;
  },
  async remove(id: string) {
    await http.delete(`/statistics/${id}`);
  },
};
