import { AppUser } from '../../shared/types/auth';
import { http } from '../../shared/api/http';
import { Course } from '../course/api';

export interface Group {
  id: string;
  name: string;
  course: Course | string;
  teacher: AppUser | string;
  students: Array<AppUser | string>;
}

export interface GroupFormValues {
  name: string;
  course: string;
  teacher: string;
  students?: string[];
}

export const groupsApi = {
  async getAll() {
    const { data } = await http.get<Group[]>('/groups');
    return data;
  },
  async create(payload: GroupFormValues) {
    const { data } = await http.post<Group>('/groups', payload);
    return data;
  },
  async update(id: string, payload: Partial<GroupFormValues>) {
    const { data } = await http.patch<Group>(`/groups/${id}`, payload);
    return data;
  },
  async remove(id: string) {
    await http.delete(`/groups/${id}`);
  },
};
