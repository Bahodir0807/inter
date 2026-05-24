import { http } from '../../shared/api/http';
import { ListQueryParams, PaginatedList } from '../../shared/types/api';

export type StudentStatus = 'active' | 'inactive' | 'archived' | 'deleted';

export interface Student {
  id: string;
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

export interface StudentFormValues {
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  telegramId?: string;
  parentPhoneNumber?: string;
  parentName?: string;
  groupIds?: string[];
  courseIds?: string[];
  branchIds?: string[];
  monthlyPayment?: number;
  paymentDueDate?: string;
  comment?: string;
  isActive?: boolean;
  status?: StudentStatus;
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

function normalizeStudentPayload(payload: StudentFormValues) {
  return Object.fromEntries(
    Object.entries(payload).flatMap(([key, value]) => {
      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed && optionalStringFields.has(key)) {
          return [];
        }
        return [[key, trimmed]];
      }

      if (Array.isArray(value)) {
        const cleaned = value.map(item => item.trim()).filter(Boolean);
        return cleaned.length ? [[key, cleaned]] : [];
      }

      if (value === undefined || value === null || value === '') {
        return [];
      }

      return [[key, value]];
    }),
  ) as Partial<StudentFormValues>;
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
