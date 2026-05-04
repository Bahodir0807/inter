import type { QueryClient, QueryKey } from '@tanstack/react-query';

export const appQueryKeys = {
  users: ['users'] as const,
  courses: ['courses'] as const,
  groups: ['groups'] as const,
  schedule: ['schedule'] as const,
  payments: ['payments'] as const,
  rooms: ['rooms'] as const,
  dashboard: ['dashboard'] as const,
  profile: ['profile'] as const,
  courseFormUsers: ['course-form-users'] as const,
  groupsFormCourses: ['groups-form-courses'] as const,
  groupsFormUsers: ['groups-form-users'] as const,
  scheduleSupport: ['schedule-support'] as const,
  paymentsSupport: ['payments-support'] as const,
} as const;

export async function invalidateQueryKeys(queryClient: QueryClient, queryKeys: readonly QueryKey[]) {
  await Promise.all(queryKeys.map(queryKey => queryClient.invalidateQueries({ queryKey })));
}
