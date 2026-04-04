import { http } from '../../shared/api/http';
import { AppUser } from '../../shared/types/auth';

export interface Course {
  id: string;
  name: string;
  description?: string;
  price: number;
  teacherId?: string | AppUser | null;
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

export const coursesApi = {
  async getAll() {
    const { data } = await http.get<Course[]>('/courses');
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
