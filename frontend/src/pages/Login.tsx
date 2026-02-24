import { useState, FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { auth, User } from '../api';

interface LoginProps {
  onLogin: (user: User, token: string) => void;
}

function Login({ onLogin }: LoginProps) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const { data: response } = await auth.login({ email, password });
      onLogin(response.data.user, response.data.token);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>{t('login')}</h2>
          <p className="auth-subtitle">{t('loginSubtitle')}</p>
        </div>
        {error && <div className="form-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{t('email')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>{t('password')}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary btn-block">
            {t('login')}
          </button>
        </form>
        <p className="auth-footer">
          <a href="/register">{t('register')}</a>
        </p>
      </div>
    </div>
  );
}

export default Login;
