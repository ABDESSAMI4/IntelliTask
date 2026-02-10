// src/components/layout/Sidebar.jsx (Version corrigée avec import correct pour l'icône BsBell)
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; 
import { useEffect, useState } from 'react';
import API from '../../services/api'; // Chemin vers src/services/api.js
import socket from '../../socket'; // Chemin vers src/socket.js
import { Badge, ListGroup, Modal } from 'react-bootstrap';
import { BsBell } from 'react-icons/bs'; // Correction : Utilisez BsBell (préfixé Bs)

const Sidebar = ({ isOpen, toggleSidebar, user, onLogout }) => {
  const { t } = useTranslation(); 
  
  const isAdmin = user?.role === 'admin' || user?.role === 'superAdmin';
  const isUser = user?.role === 'user';

  // États pour notifications
  const [notifications, setNotifications] = useState([]); // Liste des notifications
  const [unreadCount, setUnreadCount] = useState(0); // Compteur non-lus
  const [showNotificationsModal, setShowNotificationsModal] = useState(false); // Modal pour afficher la liste

  // Fetch initial des notifications et compteur
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const { data } = await API.get('/notifications'); // Route pour liste notifications (déjà existante)
        console.log('Notifications fetched:', data); // ← Log pour debug – regarde dans F12 > Console
        // Tri par date descendante (plus récentes en haut)
        setNotifications(data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
        const unread = data.filter(n => !n.isRead).length;
        setUnreadCount(unread);
      } catch (error) {
        console.error('Erreur fetch notifications:', error.response ? error.response.data : error); // ← Log erreur détaillé
      }
    };

    const fetchUnread = async () => {
      try {
        const { data } = await API.get('/notifications/unread-count'); // Route pour compteur (déjà existante)
        console.log('Unread count fetched:', data.unreadCount); // ← Log pour debug
        setUnreadCount(data.unreadCount);
      } catch (error) {
        console.error('Erreur fetch unread:', error.response ? error.response.data : error);
      }
    };

    fetchNotifications();
    fetchUnread();

    // Écoute temps réel Socket.io pour nouvelles notifications
    socket.on('newNotification', (newNotif) => {
      console.log('New notification received via socket:', newNotif); // ← Log pour debug
      setNotifications(prev => [newNotif, ...prev].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      setUnreadCount(prev => prev + 1); // Incrémente compteur
      // Optionnel : toast.info(newNotif.title); // Alert popup
    });

    return () => {
      socket.off('newNotification');
    };
  }, []);

  // Marquer une notification comme lue
  const markAsRead = async (notifId) => {
    try {
      await API.patch(`/notifications/${notifId}/read`);
      setNotifications(prev => prev.map(n => n._id === notifId ? { ...n, isRead: true } : n));
      setUnreadCount(prev => prev - 1);
    } catch (error) {
      console.error('Erreur mark as read:', error);
    }
  };

  // Marquer toutes comme lues
  const markAllAsRead = async () => {
    try {
      await API.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Erreur mark all read:', error);
    }
  };

  // Fonction pour formatter le timestamp complet (DD/MM/YYYY HH:mm:ss)
  const formatTimestamp = (date) => {
    return new Date(date).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

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
                    to="/superAdmin/settings"
                    className="text-white text-decoration-none d-block py-3 px-4 rounded hover-bg-primary-dark transition-all"
                    onClick={toggleSidebar}
                  >
                    ⚙️ {t('settings') || 'Paramètres'}
                  </Link>
                </li>
                 {/* Nouveau : Mes Affectations (visibilité pour membres concernés) */}
            <li className="mb-3">
              <Link
                to="/admin/my-assignments" // Route frontend vers page listant affectations (pending/accepted)
                className="text-white text-decoration-none d-block py-3 px-4 rounded hover-bg-primary-dark transition-all"
                onClick={toggleSidebar}
              >
                📋 Mes Affectations
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

           

            {/* Nouveau : Notifications (avec cloche et badge) */}
            <li className="mb-3">
              <div
                className="text-white text-decoration-none d-block py-3 px-4 rounded hover-bg-primary-dark transition-all cursor-pointer"
                onClick={() => {
                  setShowNotificationsModal(true);
                  toggleSidebar(); // Ferme sidebar si mobile
                }}
              >
                <BsBell className="me-2" /> Notifications
                {unreadCount > 0 && (
                  <Badge bg="danger" pill className="ms-2">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Badge>
                )}
              </div>
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

      {/* Modal pour liste des notifications (temps réel, affectations/modifs/délégations) */}
      <Modal show={showNotificationsModal} onHide={() => setShowNotificationsModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Notifications</Modal.Title>
          {unreadCount > 0 && (
            <button className="btn btn-sm btn-secondary ms-auto" onClick={markAllAsRead}>
              Marquer tout comme lu
            </button>
          )}
        </Modal.Header>
        <Modal.Body>
          <ListGroup variant="flush">
            {notifications.length === 0 ? (
              <ListGroup.Item>Aucune notification</ListGroup.Item>
            ) : (
              notifications.map(notif => (
                <ListGroup.Item
                  key={notif._id}
                  className={`d-flex justify-content-between align-items-start ${notif.isRead ? 'text-muted' : ''}`}
                  onClick={() => !notif.isRead && markAsRead(notif._id)} // Marque lu au clic si non-lu
                  style={{ cursor: 'pointer' }}
                >
                  <div>
                    <strong>{notif.title}</strong>
                    <p className="mb-1">{notif.message}</p>
                    <small>{new Date(notif.createdAt).toLocaleString()}</small>
                    {/* Liens vers tâche/user si relatedTask/relatedUser */}
                    {notif.relatedTask && (
                      <Link to={`/tasks/${notif.relatedTask._id}`} className="ms-2 small">Voir tâche</Link>
                    )}
                  </div>
                  {!notif.isRead && <Badge bg="primary">Nouveau</Badge>}
                </ListGroup.Item>
              ))
            )}
          </ListGroup>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default Sidebar;