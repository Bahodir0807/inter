import { AppUser } from '../../shared/types/auth';
import { http } from '../../shared/api/http';
import { ListQueryParams, PaginatedList } from '../../shared/types/api';
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

export type Weekday =
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday'
  | 'Sunday';

export interface ScheduleFormValues {
  course: string;
  room: string;
  date: string;
  timeStart: string;
  timeEnd: string;
  teacher: string;
  weekdays?: Weekday[];
  students?: string[];
  group?: string;
}

export interface ScheduleListParams extends ListQueryParams {
  teacherId?: string;
  groupId?: string;
  courseId?: string;
  studentId?: string;
  from?: string;
  to?: string;
}

export const scheduleApi = {
  async getAll(params?: ScheduleListParams) {
    const { data } = await http.get<ScheduleItem[]>('/schedule', { params });
    return data;
  },
  async getAllPage(params?: ScheduleListParams): Promise<PaginatedList<ScheduleItem>> {
    const response = await http.get<ScheduleItem[]>('/schedule', { params });
    return { items: response.data, pagination: response.apiMeta?.pagination };
  },
  async getMine() {
    const { data } = await http.get<ScheduleItem[]>('/schedule/me');
    return data;
  },
  async getByUser(id: string) {
    const { data } = await http.get<ScheduleItem[]>(`/schedule/user/${id}`);
    return data;
  },
  async getOne(id: string) {
    const { data } = await http.get<ScheduleItem>(`/schedule/${id}`);
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
