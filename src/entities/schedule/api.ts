import { AppUser } from '../../shared/types/auth';
import { http } from '../../shared/api/http';
import { Course } from '../course/api';
import { Group } from '../group/api';
import { Room } from '../room/api';

export interface ScheduleItem {
  id: string;
  date: string;
  timeStart: string;
  timeEnd: string;
  course: Course | string;
  room: Room | string;
  teacher: AppUser | string;
  students?: Array<AppUser | string>;
  group?: Group | string | null;
}

export interface ScheduleFormValues {
  course: string;
  room: string;
  date: string;
  timeStart: string;
  timeEnd: string;
  teacher: string;
  students?: string[];
  group?: string;
}

export const scheduleApi = {
  async getAll() {
    const { data } = await http.get<ScheduleItem[]>('/schedule');
    return data;
  },
  async getMine() {
    const { data } = await http.get<ScheduleItem[]>('/schedule/me');
    return data;
  },
  async create(payload: ScheduleFormValues) {
    const { data } = await http.post<ScheduleItem>('/schedule', payload);
    return data;
  },
  async update(id: string, payload: Partial<ScheduleFormValues>) {
    const { data } = await http.put<ScheduleItem>(`/schedule/${id}`, payload);
    return data;
  },
  async remove(id: string) {
    await http.delete(`/schedule/${id}`);
  },
};
