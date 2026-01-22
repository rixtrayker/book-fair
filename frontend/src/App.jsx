import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './i18n';
import './App.css';

import Login from './pages/Login';
import Register from './pages/Register';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Header from './components/Header';

function App() {
  const [user, setUser] = useState(null);
  const { i18n } = useTranslation();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogin = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(newLang);
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
  };

  return (
    <BrowserRouter>
      <div className="app">
        {user && <Header user={user} onLogout={handleLogout} onToggleLanguage={toggleLanguage} />}
        
        <Routes>
          <Route path="/login" element={
            user ? <Navigate to="/" /> : <Login onLogin={handleLogin} />
          } />
          <Route path="/register" element={
            user ? <Navigate to="/" /> : <Register onLogin={handleLogin} />
          } />
          <Route path="/*" element={
            !user ? <Navigate to="/login" /> :
            user.role === 'admin' ? <AdminDashboard /> : <UserDashboard />
          } />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
