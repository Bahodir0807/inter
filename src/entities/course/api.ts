import { http } from '../../shared/api/http';
import { ListQueryParams, PaginatedList } from '../../shared/types/api';
import { AppUser } from '../../shared/types/auth';

export interface Course {
  id: string;
  name: string;
  description?: string;
  price: number;
  teacherId?: string | AppUser | null;
  teacherIds?: Array<string | AppUser>;
  teachers?: AppUser[];
  students?: Array<string | AppUser>;
  createdAt?: string;
  updatedAt?: string;
}

export interface CourseFormValues {
  name: string;
  description?: string;
  price: number;
  teacherId?: string;
  students?: string[];
}

export interface CoursesListParams extends ListQueryParams {
  teacherId?: string;
  studentId?: string;
}

export const coursesApi = {
  async getAll(params?: CoursesListParams) {
    const { data } = await http.get<Course[]>('/courses', { params });
    return data;
  },
  async getAllPage(params?: CoursesListParams): Promise<PaginatedList<Course>> {
    const response = await http.get<Course[]>('/courses', { params });
    return { items: response.data, pagination: response.apiMeta?.pagination };
  },
  async getOne(id: string) {
    const { data } = await http.get<Course>(`/courses/${id}`);
    return data;
  },
  async create(payload: CourseFormValues) {
    const { data } = await http.post<Course>('/courses', payload);
    return data;
  },
  async update(id: string, payload: Partial<CourseFormValues>) {
    const { data } = await http.patch<Course>(`/courses/${id}`, payload);
    return data;
  },
  async addStudents(id: string, studentIds: string[]) {
    const { data } = await http.patch<Course>(`/courses/${id}/add-students`, { studentIds });
    return data;
  },
  async remove(id: string) {
    await http.delete(`/courses/${id}`);
  },
};
