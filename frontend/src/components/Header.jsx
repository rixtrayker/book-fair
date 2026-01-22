import React from 'react';
import { useTranslation } from 'react-i18next';

function Header({ user, onLogout, onToggleLanguage }) {
  const { t, i18n } = useTranslation();

  return (
    <div className="header">
      <h1>📚 Book Fair</h1>
      <div className="header-actions">
        <span>{user.name} ({t(user.role)})</span>
        <button className="btn btn-secondary" onClick={onToggleLanguage}>
          {i18n.language === 'en' ? 'العربية' : 'English'}
        </button>
        <button className="btn btn-danger" onClick={onLogout}>
          {t('logout')}
        </button>
      </div>
    </div>
  );
}

export default Header;
