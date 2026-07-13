import { NavLink } from 'react-router-dom';
import { Role } from '../../shared/types/auth';
import { navigationItems } from '../../app/router/navigation';
import { cn } from '../../shared/lib/cn';
import { getRoleDisplayName } from '../../shared/lib/entity-display';
import { AppIcon } from '../../shared/ui/icons/app-icon';
import { useI18n } from '../../shared/i18n/i18n';
import styles from './sidebar.module.css';
import '../../../public/NeducoLogoDark.png';
export function Sidebar({
  role,
  open,
  onNavigate,
}: {
  role: Role;
  open: boolean;
  onNavigate?: () => void;
}) {
  const items = navigationItems.filter(item => item.roles.includes(role));
  const { t } = useI18n();

  return (
    <aside id="app-sidebar" className={cn(styles.appSidebar, open && styles.appSidebarOpen)}>
      <div className={styles.appSidebarBrand}>
        <img src="/NeducoLogoDark.png" alt="Neduco Logo" width="32" height="32" />
        <div className={styles.appSidebarBrandCopy}>
          <strong>Neduco</strong>
          <p>{t('shell.brandHint')}</p>
        </div>
      </div>
      <div className={styles.appSidebarSection}>
        <span className={styles.appSidebarSectionLabel}>{t('common.workspace')}</span>
        <nav className={styles.appSidebarNav}>
          {items.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => cn(styles.appSidebarLink, isActive && styles.appSidebarLinkActive)}
              onClick={onNavigate}
            >
              <span className={styles.appSidebarIcon} aria-hidden="true">
                <AppIcon name={item.icon} />
              </span>
              <span className={styles.appSidebarLinkCopy}>
                <span className={styles.appSidebarLabel}>{t(item.labelKey, item.label)}</span>
                {item.descriptionKey ? (
                  <span className={styles.appSidebarDescription}>{t(item.descriptionKey, item.description)}</span>
                ) : null}
              </span>
            </NavLink>
          ))}
        </nav>
      </div>
      <div className={styles.appSidebarFooter}>
        <span className="subtle">{t('common.currentRole')}</span>
        <strong>{getRoleDisplayName(role)}</strong>
      </div>
    </aside>
  );
}
