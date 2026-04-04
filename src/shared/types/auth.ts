export type Role = 'owner' | 'admin' | 'teacher' | 'student' | 'panda' | 'guest';

export const roleLabels: Record<Role, string> = {
  owner: 'Owner',
  admin: 'Admin',
  teacher: 'Teacher',
  student: 'Student',
  panda: 'Panda',
  guest: 'Guest',
};

export const roleOptions: Array<{ value: Role; label: string }> = [
  { value: 'owner', label: roleLabels.owner },
  { value: 'admin', label: roleLabels.admin },
  { value: 'teacher', label: roleLabels.teacher },
  { value: 'student', label: roleLabels.student },
  { value: 'panda', label: roleLabels.panda },
  { value: 'guest', label: roleLabels.guest },
];

export interface AppUser {
  id: string;
  username: string;
  telegramId?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role: Role;
  phoneNumber?: string;
  isActive: boolean;
  avatarUrl?: string;
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
