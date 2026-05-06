import { Button } from '../../shared/ui/buttons/button';
import { Breadcrumbs } from './breadcrumbs';
import { useAuthStore } from '../../features/auth/model/auth-store';
import { getRoleDisplayName, getUserDisplayName } from '../../shared/lib/entity-display';
import { AppIcon } from '../../shared/ui/icons/app-icon';
import { env } from '../../shared/config/env';
import { languageOptions, useI18n } from '../../shared/i18n/i18n';
import { useTheme } from '../../shared/theme/theme';
import { Select } from '../../shared/ui/forms/select';

export function Topbar({ open, onMenuToggle }: { open: boolean; onMenuToggle: () => void }) {
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);
  const { language, setLanguage, t } = useI18n();
  const { theme, setTheme } = useTheme();
  const userName = getUserDisplayName(user) || 'CRM user';
  const initials = userName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('') || 'IC';

  return (
    <header className="app-topbar">
      <div className="app-topbar__left">
        <Button
          variant="ghost"
          className="app-topbar__menu"
          aria-expanded={open}
          aria-controls="app-sidebar"
          onClick={onMenuToggle}
        >
          <AppIcon name="menu" />
          <span>{t('common.menu')}</span>
        </Button>
        <div className="app-topbar__identity">
          <Breadcrumbs />
          <div className="app-topbar__headline">
            <strong>{t('shell.headline')}</strong>
            <span className="subtle">{t('shell.subheadline')}</span>
          </div>
        </div>
      </div>
      <div className="app-topbar__right">
        <div className="app-topbar__controls">
          <Select
            aria-label={t('common.language')}
            value={language}
            onChange={event => setLanguage(event.target.value as typeof language)}
          >
            {languageOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <Select
            aria-label={t('common.theme')}
            value={theme}
            onChange={event => setTheme(event.target.value as typeof theme)}
          >
            <option value="light">{t('theme.light')}</option>
            <option value="dark">{t('theme.dark')}</option>
          </Select>
        </div>
        <div className={`environment-badge environment-badge--${env.appEnv}`} title={`${env.appVersion}+${env.buildHash}`}>
          <strong>{env.appEnv.toUpperCase()}</strong>
          <span>{env.appVersion}</span>
        </div>
        <div className="app-topbar__user-chip">
          <span className="app-topbar__avatar" aria-hidden="true">
            {initials}
          </span>
          <div className="app-topbar__user-copy">
            <strong>{userName}</strong>
            <span className="subtle">{getRoleDisplayName(user?.role)}</span>
          </div>
        </div>
        <Button variant="ghost" onClick={logout}>
          <AppIcon name="logout" />
          <span>{t('common.logOut')}</span>
        </Button>
      </div>
    </header>
  );
}
