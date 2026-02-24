import { useState, FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { auth, User } from '../api';

interface RegisterProps {
  onLogin: (user: User, token: string) => void;
}

function Register({ onLogin }: RegisterProps) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const { data: response } = await auth.register({ email, password, name });
      onLogin(response.data.user, response.data.token);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>{t('register')}</h2>
          <p className="auth-subtitle">{t('registerSubtitle')}</p>
        </div>
        {error && <div className="form-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{t('name')}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
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
              minLength={6}
            />
          </div>
          <button type="submit" className="btn btn-primary btn-block">
            {t('register')}
          </button>
        </form>
        <p className="auth-footer">
          <a href="/login">{t('login')}</a>
        </p>
      </div>
    </div>
  );
}

export default Register;
