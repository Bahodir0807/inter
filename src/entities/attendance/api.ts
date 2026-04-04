import { http } from '../../shared/api/http';

export interface AttendanceEntry {
  id: string;
  date: string;
  status: string;
}

export const attendanceApi = {
  async getMine() {
    const { data } = await http.get<AttendanceEntry[]>('/attendance/me');
    return data;
  },
};
