import { http } from '../../shared/api/http';

export interface HomeworkEntry {
  id: string;
  date: string;
  tasks: string[];
  completed: boolean;
}

export const homeworkApi = {
  async getMine() {
    const { data } = await http.get<HomeworkEntry[]>('/homework/me');
    return data;
  },
};
