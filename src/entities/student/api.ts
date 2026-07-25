import { http } from '../../shared/api/http';
import { ListQueryParams, PaginatedList } from '../../shared/types/api';
import type { StudentFormValues } from '../../shared/lib/schemas/student-schema';
export type { StudentFormValues } from '../../shared/lib/schemas/student-schema';

export type StudentStatus = 'active' | 'inactive' | 'archived' | 'deleted';

export interface Student {
  id: string;
  studentNumber?: string;
  userAccountId?: string;
  fullName?: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  telegramId?: string;
  parentPhoneNumber?: string;
  parentName?: string;
  groupIds: string[];
  courseIds: string[];
  branchIds: string[];
  monthlyPayment?: number;
  paymentDueDate?: string;
  comment?: string;
  isActive: boolean;
  status: StudentStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface StudentsListParams extends ListQueryParams {
  status?: StudentStatus;
  isActive?: boolean;
  branchId?: string;
  courseId?: string;
  groupId?: string;
  teacherId?: string;
}

const optionalStringFields = new Set([
  'phoneNumber',
  'telegramId',
  'parentPhoneNumber',
  'parentName',
  'paymentDueDate',
  'comment',
]);

function normalizeStudentPayload(payload: Partial<StudentFormValues>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(payload)) {
    const value = (payload as Record<string, unknown>)[key];
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed || !optionalStringFields.has(key)) {
        result[key] = trimmed;
      }
    } else if (Array.isArray(value)) {
      const cleaned = value.filter((item): item is string => typeof item === 'string').map(item => item.trim()).filter(Boolean);
      if (cleaned.length) {
        result[key] = cleaned;
      }
    } else if (value !== undefined && value !== null) {
      result[key] = value;
    }
  }
  return result;
}

export async function updateStudent(id: string, data: StudentFormValues) {
  return http.post(`/students/${id}`, data);
}

export const studentsApi = {
  async getStudents(params?: StudentsListParams) {
    const { data } = await http.get<Student[]>('/students', { params });
    return data;
  },
  async getStudentsPage(params?: StudentsListParams): Promise<PaginatedList<Student>> {
    const response = await http.get<Student[]>('/students', { params });
    return { items: response.data, pagination: response.apiMeta?.pagination };
  },
  async getStudent(id: string) {
    const { data } = await http.get<Student>(`/students/${id}`);
    return data;
  },
  async createStudent(payload: StudentFormValues) {
    const { data } = await http.post<Student>('/students', normalizeStudentPayload(payload));
    return data;
  },
  async updateStudent(id: string, payload: StudentFormValues) {
    const { data } = await http.patch<Student>(`/students/${id}`, normalizeStudentPayload(payload));
    return data;
  },
  async archiveStudent(id: string) {
    const { data } = await http.delete<Student>(`/students/${id}`);
    return data;
  },
};