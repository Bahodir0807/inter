import { http } from '../../shared/api/http';
import { AppUser } from '../../shared/types/auth';

export interface GradeEntry {
  id: string;
  userId?: string | AppUser;
  subject: string;
  score: number;
  date?: string;
}

export interface GradeFormValues {
  userId: string;
  subject: string;
  score: number;
}

export const gradesApi = {
  async getMine() {
    const { data } = await http.get<GradeEntry[]>('/grades/me');
    return data;
  },
  async getByUser(userId: string) {
    const { data } = await http.get<GradeEntry[]>(`/grades/user/${userId}`);
    return data;
  },
  async create(payload: GradeFormValues) {
    const { data } = await http.post<GradeEntry>('/grades', payload);
    return data;
  },
  async update(id: string, score: number) {
    const { data } = await http.patch<GradeEntry>(`/grades/${id}`, { score });
    return data;
  },
  async remove(id: string) {
    await http.delete(`/grades/${id}`);
  },
};
