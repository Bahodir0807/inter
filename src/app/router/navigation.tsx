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
  description: string;
  descriptionKey?: string;
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
const teacherWorkspaceRoles: Role[] = ['teacher', ...adminLikeRoles];

export const appRoutes: AppRouteConfig[] = [
  { path: '/app/dashboard', label: 'Dashboard', labelKey: 'nav.dashboard', description: 'What needs attention now', descriptionKey: 'nav.dashboardDescription', shortLabel: 'DB', icon: 'dashboard', roles: allAppRoles, element: <DashboardPage />, nav: true },
  { path: '/app/users', label: 'People', labelKey: 'nav.users', description: 'Students, teachers, and access', descriptionKey: 'nav.usersDescription', shortLabel: 'US', icon: 'users', roles: ['teacher', 'admin', 'owner', 'panda'], element: <UsersPage />, nav: true },
  { path: '/app/courses', label: 'Courses', labelKey: 'nav.courses', description: 'Programs, prices, teachers', descriptionKey: 'nav.coursesDescription', shortLabel: 'CR', icon: 'courses', roles: teacherWorkspaceRoles, element: <CoursesPage />, nav: true },
  { path: '/app/groups', label: 'Groups', labelKey: 'nav.groups', description: 'Cohorts and rosters', descriptionKey: 'nav.groupsDescription', shortLabel: 'GR', icon: 'groups', roles: teacherWorkspaceRoles, element: <GroupsPage />, nav: true },
  { path: '/app/schedule', label: 'Schedule', labelKey: 'nav.schedule', description: 'Lessons and rooms', descriptionKey: 'nav.scheduleDescription', shortLabel: 'SC', icon: 'schedule', roles: teacherWorkspaceRoles, element: <SchedulePage />, nav: true },
  { path: '/app/rooms', label: 'Rooms', labelKey: 'nav.rooms', description: 'Classroom availability', descriptionKey: 'nav.roomsDescription', shortLabel: 'RM', icon: 'rooms', roles: adminLikeRoles, element: <RoomsPage />, nav: true },
  { path: '/app/payments', label: 'Payments', labelKey: 'nav.payments', description: 'Ledger and confirmations', descriptionKey: 'nav.paymentsDescription', shortLabel: 'PY', icon: 'payments', roles: ['student', ...paymentsManagerRoles], element: <PaymentsPage />, nav: true },
  { path: '/app/academic', label: 'Attendance & grades', labelKey: 'nav.academic', description: 'Attendance and grades', descriptionKey: 'nav.academicDescription', shortLabel: 'AC', icon: 'courses', roles: allAppRoles, element: <AcademicPage />, nav: true },
  { path: '/app/admin-tools', label: 'Admin', labelKey: 'nav.adminTools', description: 'System-only tools', descriptionKey: 'nav.adminToolsDescription', shortLabel: 'AT', icon: 'users', roles: adminLikeRoles, element: <AdminToolsPage />, nav: true },
  { path: '/app/profile', label: 'Profile', labelKey: 'nav.profile', description: 'Your account settings', descriptionKey: 'nav.profileDescription', shortLabel: 'PF', icon: 'profile', roles: allAppRoles, element: <ProfilePage />, nav: true },
];

export const navigationItems = appRoutes.filter(route => route.nav);
export const routeMetaByPath = Object.fromEntries(
  appRoutes.map(item => [item.path, item]),
) as Record<string, AppRouteConfig>;
