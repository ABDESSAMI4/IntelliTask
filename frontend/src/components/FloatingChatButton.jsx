// src/components/FloatingChatButton.jsx - Tout le chat ici !
import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import ChatBox from './ChatBox';

const FloatingChatButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const location = useLocation();

  // Détecte si on est sur une page qui affiche des tâches (pour activer l'onglet tâche)
  const showTaskTab = location.pathname.includes('/admin/tasks') || location.pathname.includes('/dashboard');

  return (
    <>
      {/* Bouton flottant 🤖 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="position-fixed btn btn-primary rounded-circle shadow-lg d-flex align-items-center justify-content-center"
        style={{
          bottom: '30px',
          right: '30px',
          width: '65px',
          height: '65px',
          zIndex: 1000,
          fontSize: '32px'
        }}
        aria-label="Ouvrir le chat"
      >
        {isOpen ? '✖' : '🤖'}
      </button>

      {/* Fenêtre chat avec onglets */}
      {isOpen && (
        <div
          className="position-fixed card shadow-lg border-0 overflow-hidden"
          style={{
            bottom: '110px',
            right: '30px',
            width: '400px',
            height: '550px',
            zIndex: 999
          }}
        >
          {/* Header avec onglets */}
          <div className="card-header bg-primary text-white p-0">
            <ul className="nav nav-tabs card-header-tabs border-0">
              <li className="nav-item flex-fill">
                <button
                  className={`nav-link text-white w-100 h-100 border-0 rounded-0 ${activeTab === 'general' ? 'bg-primary' : 'bg-secondary opacity-75'}`}
                  onClick={() => setActiveTab('general')}
                >
                  🌐 Général
                </button>
              </li>
              {showTaskTab && (
                <li className="nav-item flex-fill">
                  <button
                    className={`nav-link text-white w-100 h-100 border-0 rounded-0 ${activeTab === 'task' ? 'bg-primary' : 'bg-secondary opacity-75'}`}
                    onClick={() => setActiveTab('task')}
                  >
                    💬 Tâche
                  </button>
                </li>
              )}
              <li className="nav-item">
                <button
                  onClick={() => setIsOpen(false)}
                  className="btn-close btn-close-white ms-2 me-3 mt-2"
                  aria-label="Fermer"
                />
              </li>
            </ul>
          </div>

          {/* Contenu du chat */}
          <div className="card-body p-0 d-flex flex-column h-100">
            {activeTab === 'general' && <ChatBox taskId={null} />}
            {activeTab === 'task' && showTaskTab && <ChatBox taskId={null} />} {/* Tu peux passer taskId dynamique plus tard */}
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingChatButton;