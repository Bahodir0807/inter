import { http } from '../../shared/api/http';

export interface GradeEntry {
  id: string;
  subject: string;
  score: number;
  date?: string;
}

export const gradesApi = {
  async getMine() {
    const { data } = await http.get<GradeEntry[]>('/grades/me');
    return data;
  },
};
