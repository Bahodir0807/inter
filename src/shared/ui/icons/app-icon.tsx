import { ReactElement, SVGProps } from 'react';
import { cn } from '../../lib/cn';

export type AppIconName =
  | 'dashboard'
  | 'users'
  | 'courses'
  | 'groups'
  | 'schedule'
  | 'rooms'
  | 'payments'
  | 'profile'
  | 'menu'
  | 'logout'
  | 'spark'
  | 'chevron-right';

interface AppIconProps extends SVGProps<SVGSVGElement> {
  name: AppIconName;
}

export function AppIcon({ name, className, ...props }: AppIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn('app-icon', className)}
      {...props}
    >
      {iconPaths[name]}
    </svg>
  );
}

const iconPaths: Record<AppIconName, ReactElement> = {
  dashboard: (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="4.5" rx="1.5" />
      <rect x="13.5" y="11.5" width="7" height="9" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
    </>
  ),
  users: (
    <>
      <path d="M16.5 19a4.5 4.5 0 0 0-9 0" />
      <circle cx="12" cy="8.25" r="3.25" />
      <path d="M20 18.5a3.5 3.5 0 0 0-3-3.45" />
      <path d="M17 5.35a3.2 3.2 0 0 1 0 5.8" />
    </>
  ),
  courses: (
    <>
      <path d="M4.5 6.5 12 3l7.5 3.5L12 10 4.5 6.5Z" />
      <path d="M6 9.5v5.2c0 .9.55 1.72 1.38 2.06L12 18.5l4.62-1.74A2.2 2.2 0 0 0 18 14.7V9.5" />
    </>
  ),
  groups: (
    <>
      <circle cx="8" cy="9" r="2.5" />
      <circle cx="16" cy="9" r="2.5" />
      <path d="M4.75 18a3.25 3.25 0 0 1 6.5 0" />
      <path d="M12.75 18a3.25 3.25 0 0 1 6.5 0" />
    </>
  ),
  schedule: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path d="M8 3.5v3" />
      <path d="M16 3.5v3" />
      <path d="M3.5 10.5h17" />
      <path d="M8 14h3" />
      <path d="M13.5 14h2.5" />
    </>
  ),
  rooms: (
    <>
      <path d="M5.5 20.5v-13A1.5 1.5 0 0 1 7 6h10a1.5 1.5 0 0 1 1.5 1.5v13" />
      <path d="M3.5 20.5h17" />
      <path d="M9 10h.01" />
      <path d="M15 10h.01" />
      <path d="M11.5 20.5v-4h1v4" />
    </>
  ),
  payments: (
    <>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="M3.5 10h17" />
      <path d="M8 14.25h5.5" />
      <path d="M15.5 14.25h.5" />
    </>
  ),
  profile: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 19a7 7 0 0 1 14 0" />
    </>
  ),
  menu: (
    <>
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </>
  ),
  logout: (
    <>
      <path d="M9 4.5H6.5A2.5 2.5 0 0 0 4 7v10a2.5 2.5 0 0 0 2.5 2.5H9" />
      <path d="M14 16.5 19 12l-5-4.5" />
      <path d="M10 12h9" />
    </>
  ),
  spark: (
    <>
      <path d="m12 3 1.65 4.35L18 9l-4.35 1.65L12 15l-1.65-4.35L6 9l4.35-1.65L12 3Z" />
      <path d="m18.5 15.5.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z" />
      <path d="m5.5 14.5.6 1.6 1.6.6-1.6.6-.6 1.6-.6-1.6-1.6-.6 1.6-.6.6-1.6Z" />
    </>
  ),
  'chevron-right': <path d="m9 6 6 6-6 6" />,
};
