// src/components/layout/Header.jsx
import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import Sidebar from './Sidebar';

const Header = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Déconnexion réussie ! À bientôt 👋');
    navigate('/login');
  };

  const toggleSidebar = () => {
    console.log('Toggle sidebar – avant :', sidebarOpen); // Pour debug
    setSidebarOpen(prev => !prev);
  };

  return (
    <>
      <nav className="navbar navbar-dark bg-primary shadow-sm fixed-top">
        <div className="container-fluid">
          {/* Bouton ☰ – toujours visible, clic garanti */}
          <button
            className="btn btn-lg text-white p-2 me-3"
            onClick={toggleSidebar}
            aria-label="Menu"
            style={{ fontSize: '28px', background: 'none', border: 'none' }}
          >
            ☰
          </button>

          <Link
            className="navbar-brand fw-bold fs-3 text-white mx-auto mx-lg-0"
            to={user?.role === 'admin' || user?.role === 'superAdmin' ? '/admin/dashboard' : '/dashboard'}
          >
            IntelliTask
          </Link>

          {/* Profil desktop */}
          <div className="d-none d-lg-flex align-items-center ms-auto">
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
              Déconnexion
            </button>
          </div>
        </div>
      </nav>

      {/* Sidebar – reçoit bien le state */}
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