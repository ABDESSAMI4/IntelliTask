// FloatingChatButton.jsx
import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import ChatBox from './ChatBox';

const FloatingChatButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const location = useLocation();

  const showTaskTab = location.pathname.includes('/admin/tasks') || location.pathname.includes('/dashboard');

  return (
    <>
      <style>
        {`
          .floating-chat-btn {
            transition: all 0.3s ease;
            box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border: 3px solid white;
          }
          
          .floating-chat-btn:hover {
            transform: scale(1.15);
            box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
          }
          
          .chat-window {
            animation: slideUp 0.3s ease;
            border: 3px solid #667eea;
            border-radius: 15px;
            box-shadow: 0 15px 50px rgba(0, 0, 0, 0.3);
            z-index: 1050 !important;
          }
          
          .chat-header-bar {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            height: 50px;
            position: sticky;
            top: 0;
            z-index: 10;
          }
          
          .chat-tab-btn {
            transition: all 0.3s ease;
            font-weight: 500;
            border-radius: 8px 8px 0 0;
            margin: 0 5px;
          }
          
          .chat-tab-btn:hover:not(.active):not(:disabled) {
            background-color: rgba(255, 255, 255, 0.1);
            transform: translateY(-2px);
          }
          
          .chat-tab-btn.active {
            font-weight: bold;
            background-color: white;
            color: #667eea;
            box-shadow: 0 -3px 10px rgba(0, 0, 0, 0.1);
            border-bottom: 3px solid #667eea;
          }
          
          .close-btn {
            transition: all 0.3s ease;
            width: 35px;
            height: 35px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .close-btn:hover {
            background-color: rgba(255, 255, 255, 0.2);
            transform: rotate(90deg);
          }
          
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(30px) scale(0.95);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
          
          @media (max-width: 768px) {
            .chat-window {
              width: 95vw !important;
              right: 2.5vw !important;
              bottom: 90px !important;
              height: 70vh !important;
            }
            
            .floating-chat-btn {
              width: 60px !important;
              height: 60px !important;
              bottom: 20px !important;
              right: 20px !important;
              font-size: 28px !important;
            }
            
            .chat-header-bar {
              height: 45px;
              padding: 8px 10px !important;
            }
          }
          
          /* Pour le bouton flottant quand le chat est ouvert */
          .floating-chat-btn.chat-open {
            transform: scale(0.9);
            opacity: 0.9;
          }
        `}
      </style>

      {/* Bouton flottant - TOUJOURS visible */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`position-fixed btn rounded-circle shadow-lg d-flex align-items-center justify-content-center floating-chat-btn ${isOpen ? 'chat-open' : ''}`}
        style={{
          bottom: '30px',
          right: '30px',
          width: '70px',
          height: '70px',
          zIndex: 1060,
          fontSize: '32px',
          color: 'white'
        }}
        aria-label={isOpen ? "Fermer le chat" : "Ouvrir le chat"}
      >
        {isOpen ? '✖' : '💬'}
      </button>

      {/* Fenêtre chat */}
      {isOpen && (
        <div
          className="position-fixed card shadow-lg overflow-hidden chat-window"
          style={{
            bottom: '120px', // Position plus haute pour éviter le header
            right: '30px',
            width: '450px',
            height: '550px', // Hauteur réduite pour mieux s'afficher
            zIndex: 1050
          }}
        >
          {/* Barre de titre COMPACTE */}
          <div className="chat-header-bar d-flex align-items-center justify-content-between text-white px-3">
            <div className="d-flex align-items-center">
              <span className="fs-5 me-2">💬</span>
              <span className="fw-bold">CHAT</span>
            </div>
            
            <div className="d-flex align-items-center gap-2">
              {/* Onglets COMPACTS */}
              <button
                className={`chat-tab-btn btn btn-sm ${activeTab === 'general' ? 'active' : 'btn-outline-light'}`}
                onClick={() => setActiveTab('general')}
                style={{ padding: '5px 12px', fontSize: '0.85rem' }}
              >
                Général
              </button>
              
              {showTaskTab && (
                <button
                  className={`chat-tab-btn btn btn-sm ${activeTab === 'task' ? 'active' : 'btn-outline-light'}`}
                  onClick={() => setActiveTab('task')}
                  style={{ padding: '5px 12px', fontSize: '0.85rem' }}
                >
                  Tâche
                </button>
              )}
              
              {!showTaskTab && (
                <button
                  className="chat-tab-btn btn btn-sm btn-outline-light"
                  disabled
                  style={{ 
                    padding: '5px 12px', 
                    fontSize: '0.85rem',
                    opacity: 0.5,
                    cursor: 'not-allowed'
                  }}
                  title="Disponible sur les pages de tâches"
                >
                  Tâche
                </button>
              )}
              
              {/* Bouton fermer */}
              <button
                onClick={() => setIsOpen(false)}
                className="close-btn btn btn-sm btn-outline-light ms-2"
                aria-label="Fermer"
                style={{ padding: 0 }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          </div>

          {/* Contenu du chat */}
          <div className="card-body p-0 d-flex flex-column h-100">
            {activeTab === 'general' && <ChatBox taskId={null} />}
            {activeTab === 'task' && showTaskTab && <ChatBox taskId={null} />}
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingChatButton;