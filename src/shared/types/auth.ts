export type Role = 'owner' | 'admin' | 'teacher' | 'student' | 'panda';
export type StudentPaymentMethod = 'cash' | 'card';

export const roleLabels: Record<Role, string> = {
  owner: 'Owner',
  admin: 'Admin',
  teacher: 'Teacher',
  student: 'Student',
  panda: 'Internal',
};

export const roleOptions: Array<{ value: Role; label: string }> = [
  { value: 'owner', label: roleLabels.owner },
  { value: 'admin', label: roleLabels.admin },
  { value: 'teacher', label: roleLabels.teacher },
  { value: 'student', label: roleLabels.student },
];

export const assignableRoleOptions: Array<{ value: Exclude<Role, 'student' | 'panda'>; label: string }> = [
  { value: 'owner', label: roleLabels.owner },
  { value: 'admin', label: roleLabels.admin },
  { value: 'teacher', label: roleLabels.teacher },
];

export interface AppUser {
  id: string;
  username: string;
  fullName?: string;
  telegramId?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role: Role;
  phoneNumber?: string;
  isActive: boolean;
  studentYear?: string;
  paymentMethod?: StudentPaymentMethod;
  contactOwner?: string;
  contactOwnerFullName?: string;
  contactOwnerRelation?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SessionPayload {
  token: string;
  role: Role;
  user: AppUser;
}

export interface AppError {
  statusCode: number;
  message: string[];
  path?: string;
  requestId?: string;
  error?: string;
}
