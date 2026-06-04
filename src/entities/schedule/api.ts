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
  weekdays?: Weekday[];
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

function toTimeValue(value: unknown) {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();
  const directMatch = trimmed.match(/^(\d{1,2}):([0-5]\d)(?::\d{2})?$/);
  if (directMatch) {
    return `${directMatch[1].padStart(2, '0')}:${directMatch[2]}`;
  }

  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }

  return trimmed;
}

export function toSchedulePayload(payload: Partial<ScheduleFormValues>) {
  const normalized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(payload)) {
    if (key === 'date' || value === undefined || value === null || value === '') {
      continue;
    }

    if (Array.isArray(value) && value.length === 0) {
      continue;
    }

    normalized[key] = key === 'timeStart' || key === 'timeEnd' ? toTimeValue(value) : value;
  }

  return normalized as Omit<ScheduleFormValues, 'date'>;
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
    const { data } = await http.post<ScheduleItem>('/schedule', toSchedulePayload(payload));
    return data;
  },
  async update(id: string, payload: Partial<ScheduleFormValues>) {
    const { data } = await http.put<ScheduleItem>(`/schedule/${id}`, toSchedulePayload(payload));
    return data;
  },
  async remove(id: string) {
    await http.delete(`/schedule/${id}`);
  },
};
