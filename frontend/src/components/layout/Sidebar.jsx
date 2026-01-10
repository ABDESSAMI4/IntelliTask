
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; 

const Sidebar = ({ isOpen, toggleSidebar, user, onLogout }) => {
  const { t } = useTranslation(); 
  
  const isAdmin = user?.role === 'admin' || user?.role === 'superAdmin';
  const isUser = user?.role === 'user';

  return (
    <>
      {/* Overlay mobile */}
      {isOpen && (
        <div
          className="position-fixed inset-0 bg-dark bg-opacity-50 d-lg-none"
          style={{ zIndex: 998 }}
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <div
        className="position-fixed top-0 start-0 h-100 bg-primary text-white shadow-lg d-flex flex-column"
        style={{
          width: '200px',
          zIndex: 999,
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s ease-in-out',
        }}
      >
        {/* En-tête Sidebar */}
        <div className="p-4 border-bottom border-light border-opacity-25 d-flex justify-content-between align-items-center">
          <h4 className="fw-bold mb-0">Menu</h4>
          <button
            onClick={toggleSidebar}
            className="btn btn-close btn-close-white d-lg-none"
            aria-label="Fermer"
          />
        </div>

        {/* Navigation */}
        <nav className="flex-grow-1 p-3 overflow-auto">
          <ul className="list-unstyled mb-0">
            {/* Menu Admin / SuperAdmin */}
            {isAdmin ? (
              <>
                <li className="mb-3">
                  <Link
                    to="/admin/dashboard"
                    className="text-white text-decoration-none d-block py-3 px-4 rounded hover-bg-primary-dark transition-all"
                    onClick={toggleSidebar}
                  >
                    📊 Dashboard Admin
                  </Link>
                </li>
                <li className="mb-3">
                  <Link
                    to="/admin/tasks"
                    className="text-white text-decoration-none d-block py-3 px-4 rounded hover-bg-primary-dark transition-all"
                    onClick={toggleSidebar}
                  >
                    📋 Tâches
                  </Link>
                </li>
                <li className="mb-3">
                  <Link
                    to="/admin/users"
                    className="text-white text-decoration-none d-block py-3 px-4 rounded hover-bg-primary-dark transition-all"
                    onClick={toggleSidebar}
                  >
                    👥 Utilisateurs
                  </Link>
                </li>
                <li className="mb-3">
                  <Link
                    to="/admin/history"
                    className="text-white text-decoration-none d-block py-3 px-4 rounded hover-bg-primary-dark transition-all"
                    onClick={toggleSidebar}
                  >
                    📜 Historique Global
                  </Link>
                </li>
                <li className="mb-3">
                  <Link
                    to="/admin/vehicles"
                    className="text-white text-decoration-none d-block py-3 px-4 rounded hover-bg-primary-dark transition-all"
                    onClick={toggleSidebar}
                  >
                    🚗 Véhicules
                  </Link>
                </li>
                {/* Lien Paramètres – UNIQUEMENT pour admin/superAdmin */}
                <li className="mb-3">
                  <Link
                    to="/admin/settings"
                    className="text-white text-decoration-none d-block py-3 px-4 rounded hover-bg-primary-dark transition-all"
                    onClick={toggleSidebar}
                  >
                    ⚙️ {t('settings') || 'Paramètres'}
                  </Link>
                </li>
              </>
            ) : (
              /* Menu Utilisateur normal */
              <>
                <li className="mb-3">
                  <Link
                    to="/dashboard"
                    className="text-white text-decoration-none d-block py-3 px-4 rounded hover-bg-primary-dark transition-all"
                    onClick={toggleSidebar}
                  >
                    🏠 Accueil
                  </Link>
                </li>
              </>
            )}

            {/* Historique – visible pour tous */}
            <li className="mb-3">
              <Link
                to="/history"
                className="text-white text-decoration-none d-block py-3 px-4 rounded hover-bg-primary-dark transition-all"
                onClick={toggleSidebar}
              >
                ⏱ Mon Historique
              </Link>
            </li>

            {/* Demander un véhicule – UNIQUEMENT pour les users normaux */}
            {isUser && (
              <li className="mb-3">
                <Link
                  to="/request-vehicle"
                  className="text-white text-decoration-none d-block py-3 px-4 rounded hover-bg-primary-dark transition-all"
                  onClick={toggleSidebar}
                >
                  🚗 Demander un véhicule
                </Link>
              </li>
            )}
          </ul>
        </nav>

        {/* Profil + Déconnexion en bas */}
        <div className="p-4 border-top border-light border-opacity-25">
          <div className="d-flex align-items-center mb-3">
            <div
              className="bg-white text-primary rounded-circle d-flex align-items-center justify-content-center me-3"
              style={{ width: '50px', height: '50px' }}
            >
              <span className="fw-bold fs-4">
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
            <div>
              <div className="fw-bold">{user?.name || user?.email}</div>
              <small className="opacity-75">{user?.role}</small>
            </div>
          </div>

          <button onClick={onLogout} className="btn btn-outline-light w-100">
            🚪 Déconnexion
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;