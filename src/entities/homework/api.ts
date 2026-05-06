import { http } from '../../shared/api/http';
import { AppUser } from '../../shared/types/auth';

export interface HomeworkEntry {
  id: string;
  userId?: string | AppUser;
  date: string;
  tasks: string[];
  completed: boolean;
}

export interface HomeworkFormValues {
  userId: string;
  date: string;
  tasks: string[];
}

export const homeworkApi = {
  async getMine() {
    const { data } = await http.get<HomeworkEntry[]>('/homework/me');
    return data;
  },
  async getByUser(userId: string) {
    const { data } = await http.get<HomeworkEntry[]>(`/homework/user/${userId}`);
    return data;
  },
  async create(payload: HomeworkFormValues) {
    const { data } = await http.post<HomeworkEntry>('/homework', payload);
    return data;
  },
  async complete(id: string) {
    const { data } = await http.patch<HomeworkEntry>(`/homework/${id}/complete`);
    return data;
  },
};
