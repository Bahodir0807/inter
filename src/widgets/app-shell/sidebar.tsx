import { NavLink } from 'react-router-dom';
import { Role } from '../../shared/types/auth';
import { navigationItems } from '../../app/router/navigation';
import { cn } from '../../shared/lib/cn';
import { getRoleDisplayName } from '../../shared/lib/entity-display';
import { AppIcon } from '../../shared/ui/icons/app-icon';
import { useI18n } from '../../shared/i18n/i18n';

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
    <aside id="app-sidebar" className={cn('app-sidebar', open && 'app-sidebar--open')}>
      <div className="app-sidebar__brand">
        <span className="app-sidebar__logo" aria-hidden="true">
          <AppIcon name="spark" />
        </span>
        <div className="app-sidebar__brand-copy">
          <strong>Inter CRM</strong>
          <p>{t('shell.brandHint')}</p>
        </div>
      </div>
      <div className="app-sidebar__section">
        <span className="app-sidebar__section-label">{t('common.workspace')}</span>
        <nav className="app-sidebar__nav">
          {items.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => cn('app-sidebar__link', isActive && 'app-sidebar__link--active')}
              onClick={onNavigate}
            >
              <span className="app-sidebar__icon" aria-hidden="true">
                <AppIcon name={item.icon} />
              </span>
              <span className="app-sidebar__link-copy">
                <span className="app-sidebar__label">{t(item.labelKey, item.label)}</span>
                {item.descriptionKey ? (
                  <span className="app-sidebar__description">{t(item.descriptionKey, item.description)}</span>
                ) : null}
              </span>
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="app-sidebar__footer">
        <span className="subtle">{t('common.currentRole')}</span>
        <strong>{getRoleDisplayName(role)}</strong>
      </div>
    </aside>
  );
}
