import { Role } from '../types/auth';

export type AppRouteKey =
  | 'dashboard'
  | 'users'
  | 'courses'
  | 'groups'
  | 'schedule'
  | 'rooms'
  | 'payments'
  | 'profile';

export interface RoleCapabilities {
  app: boolean;
  routes: Record<AppRouteKey, boolean>;
  dashboard: {
    operationalOverview: boolean;
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
  payments: {
    manage: boolean;
    delete: boolean;
    confirm: boolean;
    filter: boolean;
  };
}

const noRoutes: Record<AppRouteKey, boolean> = {
  dashboard: false,
  users: false,
  courses: false,
  groups: false,
  schedule: false,
  rooms: false,
  payments: false,
  profile: false,
};

const guestCapabilities: RoleCapabilities = {
  app: false,
  routes: noRoutes,
  dashboard: {
    operationalOverview: false,
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
  payments: {
    manage: false,
    delete: false,
    confirm: false,
    filter: false,
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
    payments: true,
    profile: true,
  },
  dashboard: {
    operationalOverview: true,
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
  payments: {
    manage: true,
    delete: true,
    confirm: true,
    filter: true,
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
    payments: false,
    profile: true,
  },
  dashboard: {
    operationalOverview: false,
  },
  users: {
    viewAll: false,
    manage: false,
    filterByRole: false,
    viewSensitiveColumns: false,
    changeRole: false,
  },
  courses: {
    manage: true,
    delete: false,
    filterByTeacher: false,
    assignTeacher: false,
  },
  groups: {
    manage: true,
    delete: false,
    filterByTeacher: false,
    assignTeacher: false,
  },
  schedule: {
    manage: true,
    delete: false,
    filterByTeacher: false,
    filterByGroup: true,
    assignTeacher: false,
  },
  rooms: {
    manage: false,
  },
  payments: {
    manage: false,
    delete: false,
    confirm: false,
    filter: false,
  },
};

const studentCapabilities: RoleCapabilities = {
  app: true,
  routes: {
    dashboard: true,
    users: false,
    courses: true,
    groups: true,
    schedule: true,
    rooms: false,
    payments: true,
    profile: true,
  },
  dashboard: {
    operationalOverview: false,
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
  payments: {
    manage: false,
    delete: false,
    confirm: false,
    filter: false,
  },
};

const roleCapabilityMap: Record<Role, RoleCapabilities> = {
  owner: adminLikeCapabilities,
  admin: adminLikeCapabilities,
  panda: adminLikeCapabilities,
  teacher: teacherCapabilities,
  student: studentCapabilities,
  guest: guestCapabilities,
};

export const appRoles = (Object.keys(roleCapabilityMap) as Role[]).filter(role => roleCapabilityMap[role].app);

export function getRoleCapabilities(role?: Role | null) {
  if (!role) {
    return guestCapabilities;
  }

  return roleCapabilityMap[role] ?? guestCapabilities;
}

export function canAccessRoute(role: Role | undefined | null, routeKey: AppRouteKey) {
  return getRoleCapabilities(role).routes[routeKey];
}

export function getRolesForRoute(routeKey: AppRouteKey) {
  return appRoles.filter(role => canAccessRoute(role, routeKey));
}
