import { http } from '../../shared/api/http';
import { ListQueryParams, PaginatedList } from '../../shared/types/api';

export interface CustomRole {
  id?: string;
  name: string;
  permissions: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface RoleFormValues {
  name: string;
  permissions: string[];
}

export const rolesApi = {
  async getAll(params?: ListQueryParams): Promise<CustomRole[]> {
    const { data } = await http.get<CustomRole[]>('/roles', { params });
    return data;
  },
  async getAllPage(params?: ListQueryParams): Promise<PaginatedList<CustomRole>> {
    const response = await http.get<CustomRole[]>('/roles', { params });
    return { items: response.data, pagination: response.apiMeta?.pagination };
  },
  async getOne(name: string) {
    const { data } = await http.get<CustomRole>(`/roles/${name}`);
    return data;
  },
  async create(payload: RoleFormValues) {
    const { data } = await http.post<CustomRole>('/roles', payload);
    return data;
  },
  async update(name: string, payload: Partial<RoleFormValues>) {
    const { data } = await http.patch<CustomRole>(`/roles/${name}`, payload);
    return data;
  },
  async remove(name: string) {
    await http.delete(`/roles/${name}`);
  },
};
