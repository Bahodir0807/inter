import { AppUser } from '../../shared/types/auth';
import { http } from '../../shared/api/http';
import { ListQueryParams, PaginatedList } from '../../shared/types/api';
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

export interface GroupsListParams extends ListQueryParams {
  teacherId?: string;
  courseId?: string;
  studentId?: string;
}

export const groupsApi = {
  async getAll(params?: GroupsListParams) {
    const { data } = await http.get<Group[]>('/groups', { params });
    return data;
  },
  async getAllPage(params?: GroupsListParams): Promise<PaginatedList<Group>> {
    const response = await http.get<Group[]>('/groups', { params });
    return { items: response.data, pagination: response.apiMeta?.pagination };
  },
  async getOne(id: string) {
    const { data } = await http.get<Group>(`/groups/${id}`);
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
