import { AppUser, Role, roleLabels } from '../types/auth';
import { Course } from '../../entities/course/api';
import { Group } from '../../entities/group/api';
import { Room } from '../../entities/room/api';

export function getUserDisplayName(user?: AppUser | string | null) {
  if (!user) {
    return '-';
  }

  if (typeof user === 'string') {
    return user;
  }

  return [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username;
}

export function getRoleDisplayName(role?: Role | null) {
  if (!role) {
    return '-';
  }

  return roleLabels[role] ?? role;
}

export function getUserListSummary(users?: Array<AppUser | string> | null, limit = 2) {
  const names = (users ?? [])
    .map(user => getUserDisplayName(user))
    .filter(Boolean)
    .filter(name => name !== '-');

  if (names.length === 0) {
    return 'No linked users';
  }

  const visible = names.slice(0, limit).join(', ');
  return names.length > limit ? `${visible} +${names.length - limit}` : visible;
}

export function getRoomTypeDisplayName(roomType?: Room['type'] | null) {
  switch (roomType) {
    case 'classroom':
      return 'Classroom';
    case 'lab':
      return 'Lab';
    case 'office':
      return 'Office';
    case 'meeting':
      return 'Meeting room';
    default:
      return '-';
  }
}

export function getCourseDisplayName(course?: Course | string | null) {
  if (!course) {
    return '-';
  }

  return typeof course === 'string' ? course : course.name;
}

export function getGroupDisplayName(group?: Group | string | null) {
  if (!group) {
    return '-';
  }

  return typeof group === 'string' ? group : group.name;
}

export function getRoomDisplayName(room?: Room | string | null) {
  if (!room) {
    return '-';
  }

  return typeof room === 'string' ? room : room.name;
}
