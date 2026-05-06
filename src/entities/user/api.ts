import { http } from '../../shared/api/http';
import { ListQueryParams, PaginatedList } from '../../shared/types/api';
import { AppUser, Role } from '../../shared/types/auth';

export type UserStatus = 'active' | 'inactive' | 'blocked';

export interface UserFormValues {
  username: string;
  password?: string;
  role?: Role;
  status?: UserStatus;
  email?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  avatarUrl?: string;
  telegramId?: string;
  roleKey?: string;
  branchIds?: string[];
}

export interface ProfileSelfServiceValues {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  avatarUrl?: string;
}

export interface UsersListParams extends ListQueryParams {
  role?: Role;
  status?: UserStatus;
  branchId?: string;
}

export interface UserSearchParams {
  username?: string;
  phone?: string;
  telegramId?: string;
}

export const usersApi = {
  async getAll(params?: UsersListParams) {
    const response = await http.get<AppUser[]>('/users', { params });
    return response.data;
  },
  async getAllPage(params?: UsersListParams): Promise<PaginatedList<AppUser>> {
    const response = await http.get<AppUser[]>('/users', { params });
    return { items: response.data, pagination: response.apiMeta?.pagination };
  },
  async getOne(id: string) {
    const { data } = await http.get<AppUser>(`/users/${id}`);
    return data;
  },
  async getStudents(params?: UsersListParams) {
    const { data } = await http.get<AppUser[]>('/users/students', { params });
    return data;
  },
  async search(params: UserSearchParams) {
    const { data } = await http.get<AppUser>('/users/search', { params });
    return data;
  },
  async me() {
    const { data } = await http.get<AppUser>('/users/me');
    return data;
  },
  async updateMyProfile(payload: ProfileSelfServiceValues) {
    const { data } = await http.patch<AppUser>('/users/me/profile', payload);
    return data;
  },
  async create(payload: UserFormValues & { password: string }) {
    const { data } = await http.post<AppUser>('/users', payload);
    return data;
  },
  async update(id: string, payload: UserFormValues) {
    const { data } = await http.put<AppUser>(`/users/${id}`, payload);
    return data;
  },
  async updateRole(id: string, role: Role) {
    const { data } = await http.patch<AppUser>(`/users/${id}/role`, { role });
    return data;
  },
  async updateStatus(id: string, status: UserStatus) {
    const { data } = await http.patch<AppUser>(`/users/${id}/status`, { status });
    return data;
  },
  async remove(id: string) {
    const { data } = await http.delete<{ message: string }>(`/users/${id}`);
    return data;
  },
};
