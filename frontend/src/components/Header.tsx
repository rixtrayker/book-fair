import { useTranslation } from 'react-i18next';
import { User } from '../api';

interface HeaderProps {
  user: User;
  onLogout: () => void;
  onToggleLanguage: () => void;
}

function Header({ user, onLogout, onToggleLanguage }: HeaderProps) {
  const { t, i18n } = useTranslation();

  return (
    <div className="header">
      <div className="brand">
        <div className="brand-title">{t('appTitle')}</div>
        <div className="brand-subtitle">{t('appSubtitle')}</div>
      </div>
      <div className="header-actions">
        <span className="user-pill">{user.name} ({t(user.role)})</span>
        <button className="btn btn-secondary" onClick={onToggleLanguage}>
          {i18n.language === 'en' ? 'العربية' : 'English'}
        </button>
        <button className="btn btn-outline" onClick={onLogout}>
          {t('logout')}
        </button>
      </div>
    </div>
  );
}

export default Header;
