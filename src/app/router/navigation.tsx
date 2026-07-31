import { paymentsManagerRoles, adminRoles } from '../../shared/lib/roles';
export { paymentsManagerRoles, adminRoles };
import { lazy, ReactNode } from 'react';
import { Role } from '../../shared/types/auth';
import { AppIconName } from '../../shared/ui/icons/app-icon';

const DashboardPage = lazy(() => import('../../pages/dashboard/dashboard-page').then(module => ({ default: module.DashboardPage })));
const UsersPage = lazy(() => import('../../pages/users/users-page').then(module => ({ default: module.UsersPage })));
const StudentsPage = lazy(() => import('../../pages/students/students-page').then(module => ({ default: module.StudentsPage })));
const CoursesPage = lazy(() => import('../../pages/courses/courses-page').then(module => ({ default: module.CoursesPage })));
const GroupsPage = lazy(() => import('../../pages/groups/groups-page').then(module => ({ default: module.GroupsPage })));
const SchedulePage = lazy(() => import('../../pages/schedule/schedule-page').then(module => ({ default: module.SchedulePage })));
const RoomsPage = lazy(() => import('../../pages/rooms/rooms-page').then(module => ({ default: module.RoomsPage })));
const BranchesPage = lazy(() => import('../../pages/branches/branches-page').then(module => ({ default: module.BranchesPage })));
const NotificationDeliveriesPage = lazy(() => import('../../pages/notification-deliveries/notification-deliveries-page').then(module => ({ default: module.NotificationDeliveriesPage })));
const PaymentsPage = lazy(() => import('../../pages/payments/payments-page').then(module => ({ default: module.PaymentsPage })));
const ProfilePage = lazy(() => import('../../pages/profile/profile-page').then(module => ({ default: module.ProfilePage })));
const AcademicPage = lazy(() => import('../../pages/academic/academic-page').then(module => ({ default: module.AcademicPage })));
const AttendancePage = lazy(() => import('../../pages/attendance/attendance-page').then(module => ({ default: module.AttendancePage })));
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
const allAppRoles: Role[] = ['teacher', 'admin', 'owner', 'panda'];
const teacherWorkspaceRoles: Role[] = ['teacher', ...adminLikeRoles];

export const appRoutes: AppRouteConfig[] = [
  { path: '/app/dashboard', label: 'Dashboard', labelKey: 'nav.dashboard', description: 'What needs attention now', descriptionKey: 'nav.dashboardDescription', shortLabel: 'DB', icon: 'dashboard', roles: allAppRoles, element: <DashboardPage />, nav: true },
  { path: '/app/users', label: 'People', labelKey: 'nav.users', description: 'Staff and access', descriptionKey: 'nav.usersDescription', shortLabel: 'US', icon: 'users', roles: ['admin', 'owner', 'panda'], element: <UsersPage />, nav: true },
  { path: '/app/students', label: 'Students', labelKey: 'nav.students', description: 'Student registry', descriptionKey: 'nav.studentsDescription', shortLabel: 'ST', icon: 'users', roles: ['admin', 'owner', 'panda'], element: <StudentsPage />, nav: true },
  { path: '/app/courses', label: 'Courses', labelKey: 'nav.courses', description: 'Programs, prices, teachers', descriptionKey: 'nav.coursesDescription', shortLabel: 'CR', icon: 'courses', roles: teacherWorkspaceRoles, element: <CoursesPage />, nav: true },
  { path: '/app/groups', label: 'Groups', labelKey: 'nav.groups', description: 'Cohorts and rosters', descriptionKey: 'nav.groupsDescription', shortLabel: 'GR', icon: 'groups', roles: teacherWorkspaceRoles, element: <GroupsPage />, nav: true },
  { path: '/app/schedule', label: 'Schedule', labelKey: 'nav.schedule', description: 'Lessons and rooms', descriptionKey: 'nav.scheduleDescription', shortLabel: 'SC', icon: 'schedule', roles: teacherWorkspaceRoles, element: <SchedulePage />, nav: true },
  { path: '/app/rooms', label: 'Rooms', labelKey: 'nav.rooms', description: 'Classroom availability', descriptionKey: 'nav.roomsDescription', shortLabel: 'RM', icon: 'rooms', roles: adminLikeRoles, element: <RoomsPage />, nav: true },
  { path: '/app/branches', label: 'Branches', labelKey: 'nav.branches', description: 'Branch directory', descriptionKey: 'nav.branchesDescription', shortLabel: 'BR', icon: 'rooms', roles: adminLikeRoles, element: <BranchesPage />, nav: true },
  { path: '/app/notifications/deliveries', label: 'Delivery history', labelKey: 'nav.notificationDeliveries', description: 'SMS and reminder attempts', descriptionKey: 'nav.notificationDeliveriesDescription', shortLabel: 'DL', icon: 'payments', roles: adminLikeRoles, element: <NotificationDeliveriesPage />, nav: true },
  { path: '/app/payments', label: 'Payments', labelKey: 'nav.payments', description: 'Ledger and confirmations', descriptionKey: 'nav.paymentsDescription', shortLabel: 'PY', icon: 'payments', roles: [...paymentsManagerRoles], element: <PaymentsPage />, nav: true },
  { path: '/app/academic', label: 'Attendance & grades', labelKey: 'nav.academic', description: 'Attendance and grades', descriptionKey: 'nav.academicDescription', shortLabel: 'AC', icon: 'courses', roles: allAppRoles, element: <AcademicPage />, nav: true },
  { path: '/app/attendance', label: 'Attendance Matrix', labelKey: 'nav.attendance', description: 'Attendance matrix view', descriptionKey: 'nav.attendanceDescription', shortLabel: 'AT', icon: 'courses', roles: teacherWorkspaceRoles, element: <AttendancePage />, nav: true },
  { path: '/app/admin-tools', label: 'Admin', labelKey: 'nav.adminTools', description: 'System-only tools', descriptionKey: 'nav.adminToolsDescription', shortLabel: 'AT', icon: 'users', roles: adminLikeRoles, element: <AdminToolsPage />, nav: true },
  { path: '/app/profile', label: 'Profile', labelKey: 'nav.profile', description: 'Your account settings', descriptionKey: 'nav.profileDescription', shortLabel: 'PF', icon: 'profile', roles: allAppRoles, element: <ProfilePage />, nav: true },
];

export const navigationItems = appRoutes.filter(route => route.nav);
export const routeMetaByPath = Object.fromEntries(
  appRoutes.map(item => [item.path, item]),
) as Record<string, AppRouteConfig>;
