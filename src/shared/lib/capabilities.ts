import { Role } from '../types/auth';

export type AppRouteKey =
  | 'dashboard'
  | 'users'
  | 'courses'
  | 'groups'
  | 'schedule'
  | 'rooms'
  | 'branches'
  | 'notificationDeliveries'
  | 'payments'
  | 'academic'
  | 'adminTools'
  | 'profile';

export interface RoleCapabilities {
  app: boolean;
  routes: Record<AppRouteKey, boolean>;
  dashboard: {
    operationalOverview: boolean;
    finance: boolean;
  };
  users: {
    viewAll: boolean;
    manage: boolean;
    filterByRole: boolean;
    viewSensitiveColumns: boolean;
    changeRole: boolean;
  };
  courses: {
    manage: boolean;
    delete: boolean;
    filterByTeacher: boolean;
    assignTeacher: boolean;
  };
  groups: {
    manage: boolean;
    delete: boolean;
    filterByTeacher: boolean;
    assignTeacher: boolean;
  };
  schedule: {
    manage: boolean;
    delete: boolean;
    filterByTeacher: boolean;
    filterByGroup: boolean;
    assignTeacher: boolean;
  };
  rooms: {
    manage: boolean;
  };
  branches: {
    view: boolean;
    edit: boolean;
  };
  notifications: {
    viewDeliveries: boolean;
  };
  payments: {
    manage: boolean;
    delete: boolean;
    confirm: boolean;
    filter: boolean;
  };
  academic: {
    view: boolean;
    manageAttendance: boolean;
    manageGrades: boolean;
    deleteGrades: boolean;
    manageHomework: boolean;
    sendNotifications: boolean;
  };
  adminTools: {
    manageRoles: boolean;
    manageStatistics: boolean;
    managePhoneRequests: boolean;
  };
}

const noRoutes: Record<AppRouteKey, boolean> = {
  dashboard: false,
  users: false,
  courses: false,
  groups: false,
  schedule: false,
  rooms: false,
  branches: false,
  notificationDeliveries: false,
  payments: false,
  academic: false,
  adminTools: false,
  profile: false,
};

const fallbackCapabilities: RoleCapabilities = {
  app: false,
  routes: noRoutes,
  dashboard: {
    operationalOverview: false,
    finance: false,
  },
  users: {
    viewAll: false,
    manage: false,
    filterByRole: false,
    viewSensitiveColumns: false,
    changeRole: false,
  },
  courses: {
    manage: false,
    delete: false,
    filterByTeacher: false,
    assignTeacher: false,
  },
  groups: {
    manage: false,
    delete: false,
    filterByTeacher: false,
    assignTeacher: false,
  },
  schedule: {
    manage: false,
    delete: false,
    filterByTeacher: false,
    filterByGroup: false,
    assignTeacher: false,
  },
  rooms: {
    manage: false,
  },
  branches: {
    view: false,
    edit: false,
  },
  notifications: {
    viewDeliveries: false,
  },
  payments: {
    manage: false,
    delete: false,
    confirm: false,
    filter: false,
  },
  academic: {
    view: false,
    manageAttendance: false,
    manageGrades: false,
    deleteGrades: false,
    manageHomework: false,
    sendNotifications: false,
  },
  adminTools: {
    manageRoles: false,
    manageStatistics: false,
    managePhoneRequests: false,
  },
};

const adminLikeCapabilities: RoleCapabilities = {
  app: true,
  routes: {
    dashboard: true,
    users: true,
    courses: true,
    groups: true,
    schedule: true,
    rooms: true,
    branches: true,
    notificationDeliveries: true,
    payments: true,
    academic: true,
    adminTools: true,
    profile: true,
  },
  dashboard: {
    operationalOverview: true,
    finance: true,
  },
  users: {
    viewAll: true,
    manage: true,
    filterByRole: true,
    viewSensitiveColumns: true,
    changeRole: true,
  },
  courses: {
    manage: true,
    delete: true,
    filterByTeacher: true,
    assignTeacher: true,
  },
  groups: {
    manage: true,
    delete: true,
    filterByTeacher: true,
    assignTeacher: true,
  },
  schedule: {
    manage: true,
    delete: true,
    filterByTeacher: true,
    filterByGroup: true,
    assignTeacher: true,
  },
  rooms: {
    manage: true,
  },
  branches: {
    view: true,
    edit: false,
  },
  notifications: {
    viewDeliveries: true,
  },
  payments: {
    manage: true,
    delete: true,
    confirm: true,
    filter: true,
  },
  academic: {
    view: true,
    manageAttendance: true,
    manageGrades: true,
    deleteGrades: true,
    manageHomework: true,
    sendNotifications: true,
  },
  adminTools: {
    manageRoles: true,
    manageStatistics: true,
    managePhoneRequests: true,
  },
};

const ownerCapabilities: RoleCapabilities = {
  ...adminLikeCapabilities,
  branches: {
    view: true,
    edit: true,
  },
};

const teacherCapabilities: RoleCapabilities = {
  app: true,
  routes: {
    dashboard: true,
    users: true,
    courses: true,
    groups: true,
    schedule: true,
    rooms: true,
    branches: false,
    notificationDeliveries: false,
    payments: false,
    academic: true,
    adminTools: false,
    profile: true,
  },
  dashboard: {
    operationalOverview: false,
    finance: false,
  },
  users: {
    viewAll: false,
    manage: false,
    filterByRole: false,
    viewSensitiveColumns: false,
    changeRole: false,
  },
  courses: {
    manage: false,
    delete: false,
    filterByTeacher: false,
    assignTeacher: false,
  },
  groups: {
    manage: false,
    delete: false,
    filterByTeacher: false,
    assignTeacher: false,
  },
  schedule: {
    manage: false,
    delete: false,
    filterByTeacher: false,
    filterByGroup: true,
    assignTeacher: false,
  },
  rooms: {
    manage: false,
  },
  branches: {
    view: false,
    edit: false,
  },
  notifications: {
    viewDeliveries: false,
  },
  payments: {
    manage: false,
    delete: false,
    confirm: false,
    filter: false,
  },
  academic: {
    view: true,
    manageAttendance: true,
    manageGrades: true,
    deleteGrades: false,
    manageHomework: true,
    sendNotifications: false,
  },
  adminTools: {
    manageRoles: false,
    manageStatistics: false,
    managePhoneRequests: false,
  },
};

const studentCapabilities: RoleCapabilities = {
  app: false,
  routes: {
    dashboard: false,
    users: false,
    courses: false,
    groups: false,
    schedule: false,
    rooms: false,
    branches: false,
    notificationDeliveries: false,
    payments: false,
    academic: false,
    adminTools: false,
    profile: false,
  },
  dashboard: {
    operationalOverview: false,
    finance: false,
  },
  users: {
    viewAll: false,
    manage: false,
    filterByRole: false,
    viewSensitiveColumns: false,
    changeRole: false,
  },
  courses: {
    manage: false,
    delete: false,
    filterByTeacher: false,
    assignTeacher: false,
  },
  groups: {
    manage: false,
    delete: false,
    filterByTeacher: false,
    assignTeacher: false,
  },
  schedule: {
    manage: false,
    delete: false,
    filterByTeacher: false,
    filterByGroup: false,
    assignTeacher: false,
  },
  rooms: {
    manage: false,
  },
  branches: {
    view: false,
    edit: false,
  },
  notifications: {
    viewDeliveries: false,
  },
  payments: {
    manage: false,
    delete: false,
    confirm: false,
    filter: false,
  },
  academic: {
    view: true,
    manageAttendance: false,
    manageGrades: false,
    deleteGrades: false,
    manageHomework: false,
    sendNotifications: false,
  },
  adminTools: {
    manageRoles: false,
    manageStatistics: false,
    managePhoneRequests: false,
  },
};

const roleCapabilityMap: Record<Role, RoleCapabilities> = {
  owner: ownerCapabilities,
  admin: adminLikeCapabilities,
  panda: ownerCapabilities,
  teacher: teacherCapabilities,
  student: studentCapabilities,
};

export const appRoles = (Object.keys(roleCapabilityMap) as Role[]).filter(role => roleCapabilityMap[role].app);

export function getRoleCapabilities(role?: Role | null) {
  if (!role) {
    return fallbackCapabilities;
  }

  return roleCapabilityMap[role] ?? adminLikeCapabilities;
}

export function canAccessRoute(role: Role | undefined | null, routeKey: AppRouteKey) {
  return getRoleCapabilities(role).routes[routeKey];
}

export function getRolesForRoute(routeKey: AppRouteKey) {
  return appRoles.filter(role => canAccessRoute(role, routeKey));
}
