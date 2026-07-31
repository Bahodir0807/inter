import { AttendanceStatus } from './api';

export interface AttendanceStatusConfig {
  label: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
}

export const ATTENDANCE_CONFIG: Record<AttendanceStatus, AttendanceStatusConfig> = {
  PRESENT: {
    label: 'Пришел',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-500',
    textColor: 'text-green-800',
  },
  ABSENT: {
    label: 'Не пришел',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-500',
    textColor: 'text-red-800',
  },
  TRIAL: {
    label: 'Пробный урок',
    bgColor: 'bg-sky-100',
    borderColor: 'border-sky-500',
    textColor: 'text-sky-800',
  },
};

export const ATTENDANCE_STATUS_ORDER: AttendanceStatus[] = ['PRESENT', 'ABSENT', 'TRIAL'];

export function getNextStatus(currentStatus: AttendanceStatus): AttendanceStatus {
  const currentIndex = ATTENDANCE_STATUS_ORDER.indexOf(currentStatus);
  const nextIndex = (currentIndex + 1) % ATTENDANCE_STATUS_ORDER.length;
  return ATTENDANCE_STATUS_ORDER[nextIndex];
}

export function getStatusConfig(status: AttendanceStatus): AttendanceStatusConfig {
  return ATTENDANCE_CONFIG[status];
}
