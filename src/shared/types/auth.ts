export type Role = 'owner' | 'admin' | 'branch_admin' | 'teacher' | 'manager' | 'panda' | 'staff' | 'student' | 'guest';
export type StudentPaymentMethod = 'cash' | 'card';

export const roleLabels: Record<Role, string> = {
  owner: 'Owner',
  admin: 'Admin',
  branch_admin: 'Branch admin',
  teacher: 'Teacher',
  manager: 'Manager',
  student: 'Student',
  panda: 'Panda',
  staff: 'Staff',
  guest: 'Guest',
};

export const roleOptions: Array<{ value: Role; label: string }> = [
  { value: 'owner', label: roleLabels.owner },
  { value: 'admin', label: roleLabels.admin },
  { value: 'branch_admin', label: roleLabels.branch_admin },
  { value: 'teacher', label: roleLabels.teacher },
  { value: 'manager', label: roleLabels.manager },
  { value: 'panda', label: roleLabels.panda },
  { value: 'staff', label: roleLabels.staff },
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
