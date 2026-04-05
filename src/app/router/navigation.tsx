import { ReactNode } from 'react';
import { Role } from '../../shared/types/auth';
import { DashboardPage } from '../../pages/dashboard/dashboard-page';
import { UsersPage } from '../../pages/users/users-page';
import { CoursesPage } from '../../pages/courses/courses-page';
import { GroupsPage } from '../../pages/groups/groups-page';
import { SchedulePage } from '../../pages/schedule/schedule-page';
import { RoomsPage } from '../../pages/rooms/rooms-page';
import { PaymentsPage } from '../../pages/payments/payments-page';
import { ProfilePage } from '../../pages/profile/profile-page';
import { AppIconName } from '../../shared/ui/icons/app-icon';

export interface AppRouteConfig {
  path: string;
  label: string;
  shortLabel: string;
  icon: AppIconName;
  roles: Role[];
  element: ReactNode;
  nav: boolean;
}

export const adminLikeRoles: Role[] = ['admin', 'owner', 'panda'];
export const teachingRoles: Role[] = ['teacher', 'admin', 'owner'];
export const paymentsManagerRoles: Role[] = ['admin', 'owner'];
const allAppRoles: Role[] = ['student', 'teacher', 'admin', 'owner', 'panda'];

export const appRoutes: AppRouteConfig[] = [
  { path: '/app/dashboard', label: 'Dashboard', shortLabel: 'DB', icon: 'dashboard', roles: allAppRoles, element: <DashboardPage />, nav: true },
  { path: '/app/users', label: 'Users', shortLabel: 'US', icon: 'users', roles: ['teacher', 'admin', 'owner', 'panda'], element: <UsersPage />, nav: true },
  { path: '/app/courses', label: 'Courses', shortLabel: 'CR', icon: 'courses', roles: ['student', 'teacher', 'admin', 'owner'], element: <CoursesPage />, nav: true },
  { path: '/app/groups', label: 'Groups', shortLabel: 'GR', icon: 'groups', roles: teachingRoles, element: <GroupsPage />, nav: true },
  { path: '/app/schedule', label: 'Schedule', shortLabel: 'SC', icon: 'schedule', roles: ['student', 'teacher', 'admin', 'owner'], element: <SchedulePage />, nav: true },
  { path: '/app/rooms', label: 'Rooms', shortLabel: 'RM', icon: 'rooms', roles: teachingRoles, element: <RoomsPage />, nav: true },
  { path: '/app/payments', label: 'Payments', shortLabel: 'PY', icon: 'payments', roles: ['student', ...paymentsManagerRoles], element: <PaymentsPage />, nav: true },
  { path: '/app/profile', label: 'Profile', shortLabel: 'PF', icon: 'profile', roles: allAppRoles, element: <ProfilePage />, nav: true },
];

export const navigationItems = appRoutes.filter(route => route.nav);
export const routeMetaByPath = Object.fromEntries(
  appRoutes.map(item => [item.path, item]),
) as Record<string, AppRouteConfig>;
