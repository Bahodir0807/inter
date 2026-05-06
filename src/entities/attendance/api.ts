import { http } from '../../shared/api/http';
import { AppUser } from '../../shared/types/auth';
import { ScheduleItem } from '../schedule/api';

export interface AttendanceEntry {
  id: string;
  date: string;
  status: AttendanceStatus;
  userId?: string | AppUser;
  scheduleId?: string | ScheduleItem;
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface AttendanceFormValues {
  userId: string;
  scheduleId?: string;
  date: string;
  status: AttendanceStatus;
}

export const attendanceApi = {
  async getMine() {
    const { data } = await http.get<AttendanceEntry[]>('/attendance/me');
    return data;
  },
  async getByUser(userId: string) {
    const { data } = await http.get<AttendanceEntry[]>(`/attendance/user/${userId}`);
    return data;
  },
  async mark(payload: AttendanceFormValues) {
    const { data } = await http.post<AttendanceEntry>('/attendance', payload);
    return data;
  },
};
