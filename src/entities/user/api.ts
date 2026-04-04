import { http } from '../../shared/api/http';
import { AppUser, Role } from '../../shared/types/auth';

export interface UserFormValues {
  username: string;
  password?: string;
  role?: Role;
  email?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  avatarUrl?: string;
  telegramId?: string;
}

export const usersApi = {
  async getAll() {
    const { data } = await http.get<AppUser[]>('/users');
    return data;
  },
  async getStudents() {
    const { data } = await http.get<AppUser[]>('/users/students');
    return data;
  },
  async me() {
    const { data } = await http.get<AppUser>('/users/me');
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
  async remove(id: string) {
    const { data } = await http.delete<{ message: string }>(`/users/${id}`);
    return data;
  },
};
