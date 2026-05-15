import { http } from '../../shared/api/http';
import { ListQueryParams, PaginatedList } from '../../shared/types/api';
import { AppUser, Role, StudentPaymentMethod } from '../../shared/types/auth';

export type UserStatus = 'active' | 'inactive' | 'blocked';

export interface UserFormValues {
  username: string;
  password?: string;
  role?: Role;
  status?: UserStatus;
  email?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  studentYear?: string;
  paymentMethod?: StudentPaymentMethod | '';
  contactOwner?: string;
  contactOwnerFullName?: string;
  contactOwnerRelation?: string;
  telegramId?: string;
  roleKey?: string;
  branchIds?: string[];
}

export interface ProfileSelfServiceValues {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
}

type UserPayload = UserFormValues | ProfileSelfServiceValues;

export const studentProfileFields = [
  'studentYear',
  'paymentMethod',
  'contactOwner',
  'contactOwnerFullName',
  'contactOwnerRelation',
] as const satisfies ReadonlyArray<keyof UserFormValues>;

const optionalStringFields = new Set([
  'email',
  'phoneNumber',
  'studentYear',
  'paymentMethod',
  'contactOwner',
  'contactOwnerFullName',
  'contactOwnerRelation',
  'telegramId',
  'roleKey',
]);

const requiredStringFields = new Set([
  'username',
  'password',
  'firstName',
  'lastName',
]);

function normalizeUserPayload<T extends UserPayload>(
  payload: T,
  options: { clearEmptyOptionals?: boolean } = {},
): Partial<T> {
  const normalized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(payload)) {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (optionalStringFields.has(key) && trimmed.length === 0) {
        if (options.clearEmptyOptionals) {
          normalized[key] = null;
        }
        continue;
      }

      normalized[key] = requiredStringFields.has(key) ? trimmed : trimmed || undefined;
      continue;
    }

    if (Array.isArray(value)) {
      const cleaned = value
        .map(item => (typeof item === 'string' ? item.trim() : item))
        .filter(item => typeof item === 'string' && item.length > 0);
      if (cleaned.length > 0) {
        normalized[key] = cleaned;
      }
      continue;
    }

    if (value !== undefined && value !== null) {
      normalized[key] = value;
    }
  }

  return normalized as Partial<T>;
}

export interface UsersListParams extends ListQueryParams {
  role?: Role;
  status?: UserStatus;
  branchId?: string;
}

export interface UserSearchParams {
  username?: string;
  phone?: string;
  telegramId?: string;
}

export const usersApi = {
  async getAll(params?: UsersListParams) {
    const response = await http.get<AppUser[]>('/users', { params });
    return response.data;
  },
  async getAllPage(params?: UsersListParams): Promise<PaginatedList<AppUser>> {
    const response = await http.get<AppUser[]>('/users', { params });
    return { items: response.data, pagination: response.apiMeta?.pagination };
  },
  async getOne(id: string) {
    const { data } = await http.get<AppUser>(`/users/${id}`);
    return data;
  },
  async getStudents(params?: UsersListParams) {
    const { data } = await http.get<AppUser[]>('/users/students', { params });
    return data;
  },
  async search(params: UserSearchParams) {
    const { data } = await http.get<AppUser>('/users/search', { params });
    return data;
  },
  async me() {
    const { data } = await http.get<AppUser>('/users/me');
    return data;
  },
  async updateMyProfile(payload: ProfileSelfServiceValues) {
    const { data } = await http.patch<AppUser>('/users/me/profile', normalizeUserPayload(payload, { clearEmptyOptionals: true }));
    return data;
  },
  async create(payload: UserFormValues & { password: string }) {
    const { data } = await http.post<AppUser>('/users', normalizeUserPayload(payload));
    return data;
  },
  async update(id: string, payload: UserFormValues) {
    const { data } = await http.patch<AppUser>(`/users/${id}`, normalizeUserPayload(payload, { clearEmptyOptionals: true }));
    return data;
  },
  async updateRole(id: string, role: Role) {
    const { data } = await http.patch<AppUser>(`/users/${id}/role`, { role });
    return data;
  },
  async updateStatus(id: string, status: UserStatus) {
    const { data } = await http.patch<AppUser>(`/users/${id}/status`, { status });
    return data;
  },
  async remove(id: string) {
    const { data } = await http.delete<{ message: string }>(`/users/${id}`);
    return data;
  },
};
