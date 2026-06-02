import { http } from '../../shared/api/http';
import { ListQueryParams, PaginatedList } from '../../shared/types/api';

export interface Branch {
  id: string;
  name?: string;
  address?: string;
  phone?: string;
  isActive?: boolean;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BranchesListParams extends ListQueryParams {
  active?: boolean;
}

export interface BranchFormValues {
  name: string;
  address?: string;
  phone?: string;
  isActive?: boolean;
  status?: string;
}

export const branchesApi = {
  async getAll(params?: BranchesListParams) {
    const response = await http.get<Branch[]>('/branches', { params });
    return response.data;
  },
  async getAllPage(params?: BranchesListParams): Promise<PaginatedList<Branch>> {
    const response = await http.get<Branch[]>('/branches', { params });
    return { items: response.data, pagination: response.apiMeta?.pagination };
  },
  async getById(id: string) {
    const response = await http.get<Branch>(`/branches/${id}`);
    return response.data;
  },
  async update(id: string, payload: BranchFormValues) {
    const response = await http.patch<Branch>(`/branches/${id}`, payload);
    return response.data;
  },
};
