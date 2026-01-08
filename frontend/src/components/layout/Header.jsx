// src/components/layout/Header.jsx - Avec Dark Mode + Langue FR/EN
import { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext'; // ← جديد: Dark Mode
import { useTranslation } from 'react-i18next'; // ← جديد: Traduction
import { toast } from 'react-toastify';
import Sidebar from './Sidebar';

const Header = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useContext(AuthContext);
  const { isDarkMode, toggleDarkMode } = useTheme(); // ← Dark Mode
  const { t, i18n } = useTranslation(); // ← Traduction

  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success(t('logout_success') || 'Déconnexion réussie ! À bientôt 👋');
    navigate('/login');
  };

  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <>
      <nav className="navbar navbar-dark bg-primary shadow-sm fixed-top">
        <div className="container-fluid position-relative">
          {/* Bouton Menu ☰ */}
          <button
            className="btn btn-lg text-white p-2 me-3"
            onClick={toggleSidebar}
            aria-label="Menu"
            style={{ fontSize: '28px', background: 'none', border: 'none' }}
          >
            ☰
          </button>

          {/* Logo central */}
          <Link
            className="navbar-brand fw-bold fs-3 text-white position-absolute start-50 translate-middle-x"
            to={user?.role === 'admin' || user?.role === 'superAdmin' ? '/admin/dashboard' : '/dashboard'}
            style={{ left: '50%' }}
          >
            IntelliTask
          </Link>

          {/* Droite: Langue + Dark Mode + Profil (desktop) */}
          <div className="d-flex align-items-center ms-auto gap-3">
           

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="text-white text-2xl transition-all hover:scale-110 rounded-circle btn-outline-light"
              title={isDarkMode ? 'Mode clair' : 'Mode sombre'}
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>

            {/* Profil utilisateur (visible seulement sur desktop) */}
            <div className="d-none d-lg-flex align-items-center">
              <div className="text-white text-end me-3">
                <div className="fw-bold">{user?.name || user?.email}</div>
                <small className="opacity-75">{user?.role}</small>
              </div>
              <div
                className="bg-white text-primary rounded-circle d-flex align-items-center justify-content-center me-3"
                style={{ width: '45px', height: '45px' }}
              >
                <span className="fw-bold fs-5">
                  {user?.name?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
              <button onClick={handleLogout} className="btn btn-outline-light">
                { 'Déconnexion'}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
        user={user}
        onLogout={handleLogout}
      />
    </>
  );
};

export default Header;