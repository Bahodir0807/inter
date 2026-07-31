import { http } from '../../shared/api/http';

export interface AttendanceEntry {
  _id: string;
  student: string;
  group: string;
  date: string;
  status: AttendanceStatus;
}

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'TRIAL';

export interface AttendanceMarkPayload {
  groupId: string;
  studentId: string;
  date: string;
  status: AttendanceStatus;
}

export interface AttendanceByGroupResponse {
  groupId: string;
  date: string;
  records: AttendanceEntry[];
}

export const attendanceApi = {
  async getByGroup(groupId: string, date: string) {
    const { data } = await http.get<AttendanceByGroupResponse>(`/attendance/by-group`, {
      params: { groupId, date }
    });
    return data;
  },
  async mark(payload: AttendanceMarkPayload) {
    const { data } = await http.post<AttendanceEntry>('/attendance/mark', payload);
    return data;
  },
  // Legacy methods for backward compatibility
  async getByUser(_userId: string) {
    // This method is deprecated - use getByGroup instead
    console.warn('attendanceApi.getByUser is deprecated. Use getByGroup with groupId parameter.');
    return [] as AttendanceEntry[];
  },
  async getMine() {
    // This method is deprecated - use getByGroup instead
    console.warn('attendanceApi.getMine is deprecated. Use getByGroup with groupId parameter.');
    return [] as AttendanceEntry[];
  },
};
