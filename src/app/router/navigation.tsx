import { lazy, ReactNode } from 'react';
import { Role } from '../../shared/types/auth';
import { AppIconName } from '../../shared/ui/icons/app-icon';

const DashboardPage = lazy(() => import('../../pages/dashboard/dashboard-page').then(module => ({ default: module.DashboardPage })));
const UsersPage = lazy(() => import('../../pages/users/users-page').then(module => ({ default: module.UsersPage })));
const CoursesPage = lazy(() => import('../../pages/courses/courses-page').then(module => ({ default: module.CoursesPage })));
const GroupsPage = lazy(() => import('../../pages/groups/groups-page').then(module => ({ default: module.GroupsPage })));
const SchedulePage = lazy(() => import('../../pages/schedule/schedule-page').then(module => ({ default: module.SchedulePage })));
const RoomsPage = lazy(() => import('../../pages/rooms/rooms-page').then(module => ({ default: module.RoomsPage })));
const PaymentsPage = lazy(() => import('../../pages/payments/payments-page').then(module => ({ default: module.PaymentsPage })));
const ProfilePage = lazy(() => import('../../pages/profile/profile-page').then(module => ({ default: module.ProfilePage })));
const AcademicPage = lazy(() => import('../../pages/academic/academic-page').then(module => ({ default: module.AcademicPage })));
const AdminToolsPage = lazy(() => import('../../pages/admin-tools/admin-tools-page').then(module => ({ default: module.AdminToolsPage })));

export interface AppRouteConfig {
  path: string;
  label: string;
  labelKey: string;
  shortLabel: string;
  icon: AppIconName;
  roles: Role[];
  element: ReactNode;
  nav: boolean;
}

export const adminLikeRoles: Role[] = ['admin', 'owner', 'panda'];
export const teachingRoles: Role[] = ['teacher', 'admin', 'owner', 'panda'];
export const paymentsManagerRoles: Role[] = ['admin', 'owner', 'panda'];
const allAppRoles: Role[] = ['student', 'teacher', 'admin', 'owner', 'panda'];

export const appRoutes: AppRouteConfig[] = [
  { path: '/app/dashboard', label: 'Dashboard', labelKey: 'nav.dashboard', shortLabel: 'DB', icon: 'dashboard', roles: allAppRoles, element: <DashboardPage />, nav: true },
  { path: '/app/users', label: 'Users', labelKey: 'nav.users', shortLabel: 'US', icon: 'users', roles: ['teacher', 'admin', 'owner', 'panda'], element: <UsersPage />, nav: true },
  { path: '/app/courses', label: 'Courses', labelKey: 'nav.courses', shortLabel: 'CR', icon: 'courses', roles: allAppRoles, element: <CoursesPage />, nav: true },
  { path: '/app/groups', label: 'Groups', labelKey: 'nav.groups', shortLabel: 'GR', icon: 'groups', roles: allAppRoles, element: <GroupsPage />, nav: true },
  { path: '/app/schedule', label: 'Schedule', labelKey: 'nav.schedule', shortLabel: 'SC', icon: 'schedule', roles: allAppRoles, element: <SchedulePage />, nav: true },
  { path: '/app/rooms', label: 'Rooms', labelKey: 'nav.rooms', shortLabel: 'RM', icon: 'rooms', roles: allAppRoles, element: <RoomsPage />, nav: true },
  { path: '/app/payments', label: 'Payments', labelKey: 'nav.payments', shortLabel: 'PY', icon: 'payments', roles: ['student', ...paymentsManagerRoles], element: <PaymentsPage />, nav: true },
  { path: '/app/academic', label: 'Academic', labelKey: 'nav.academic', shortLabel: 'AC', icon: 'courses', roles: allAppRoles, element: <AcademicPage />, nav: true },
  { path: '/app/admin-tools', label: 'Admin tools', labelKey: 'nav.adminTools', shortLabel: 'AT', icon: 'users', roles: adminLikeRoles, element: <AdminToolsPage />, nav: true },
  { path: '/app/profile', label: 'Profile', labelKey: 'nav.profile', shortLabel: 'PF', icon: 'profile', roles: allAppRoles, element: <ProfilePage />, nav: true },
];

export const navigationItems = appRoutes.filter(route => route.nav);
export const routeMetaByPath = Object.fromEntries(
  appRoutes.map(item => [item.path, item]),
) as Record<string, AppRouteConfig>;
