// ChatBox.jsx
import { useState, useEffect, useContext, useRef, useCallback } from 'react';
import API from '../services/api';
import { toast } from 'react-toastify';
import { AuthContext } from '../context/AuthContext';
import socket from '../services/socket';

const ChatBox = ({ taskId = null }) => {
  const { user } = useContext(AuthContext);

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getMessageEmoji = (senderRole, content) => {
    const lower = content.toLowerCase();

    if (senderRole === 'superAdmin') return '👑';
    if (senderRole === 'admin') return '🛡️';

    if (lower.includes('bonjour') || lower.includes('salut') || lower.includes('hi')) return '👋';
    if (lower.includes('merci') || lower.includes('thanks')) return '🙏';
    if (lower.includes('super') || lower.includes('parfait') || lower.includes('top')) return '🎉';
    if (lower.includes('ok') || lower.includes('yes')) return '✅';
    if (lower.includes('?')) return '🤔';
    if (lower.includes('lol') || lower.includes('mdr')) return '😂';

    return '💬';
  };

  const fetchMessages = useCallback(async () => {
    try {
      const endpoint = taskId
        ? `/messages/task/${taskId}`
        : '/messages/global';

      const res = await API.get(endpoint);
      setMessages(res.data);
      setLoading(false);
      scrollToBottom();
    } catch (error) {
      toast.error('Erreur chargement messages');
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    fetchMessages();

    const handleNewMessage = (message) => {
      if (
        (taskId && message.task?._id === taskId) ||
        (!taskId && !message.task)
      ) {
        setMessages((prev) => [...prev, message]);
        scrollToBottom();
      }
    };

    socket.on('newMessage', handleNewMessage);

    return () => {
      socket.off('newMessage', handleNewMessage);
    };
  }, [fetchMessages, taskId]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await API.post('/messages', {
        content: newMessage,
        taskId,
      });
      setNewMessage('');
    } catch (error) {
      toast.error('Erreur envoi message');
    }
  };

  return (
    <>
      <style>
        {`
          .chatbox-container {
            height: 100%;
            display: flex;
            flex-direction: column;
            background: linear-gradient(180deg, #f8f9fa 0%, #ffffff 100%);
          }
          
          .messages-container {
            flex: 1;
            overflow-y: auto;
            padding: 20px;
            background: transparent;
          }
          
          .message-bubble {
            max-width: 85%;
            margin-bottom: 12px;
            padding: 10px 15px;
            border-radius: 15px;
            word-wrap: break-word;
            animation: fadeIn 0.3s ease;
            position: relative;
          }
          
          .message-bubble.user {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            margin-left: auto;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
          }
          
          .message-bubble.other {
            background: white;
            border: 1px solid #e0e7ff;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          }
          
          .message-header {
            display: flex;
            align-items: center;
            margin-bottom: 5px;
            gap: 8px;
          }
          
          .message-sender {
            font-size: 0.85rem;
            font-weight: 600;
          }
          
          .message-role {
            font-size: 0.7rem;
            padding: 2px 6px;
            border-radius: 10px;
            font-weight: 500;
          }
          
          .role-superAdmin {
            background: linear-gradient(135deg, #ffd700 0%, #ffa500 100%);
            color: #000;
          }
          
          .role-admin {
            background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%);
            color: white;
          }
          
          .role-user {
            background: linear-gradient(135deg, #6c757d 0%, #495057 100%);
            color: white;
          }
          
          .message-content {
            font-size: 0.95rem;
            line-height: 1.4;
            margin-bottom: 5px;
          }
          
          .message-time {
            font-size: 0.75rem;
            opacity: 0.8;
            text-align: right;
          }
          
          .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            color: #667eea;
          }
          
          .spinner-pulse {
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 50%;
            animation: pulse 1.5s infinite;
            margin-bottom: 15px;
          }
          
          .empty-state {
            text-align: center;
            padding: 40px 20px;
            color: #6c757d;
          }
          
          .empty-state-icon {
            font-size: 3rem;
            margin-bottom: 1rem;
            opacity: 0.6;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
          
          .input-container {
            border-top: 2px solid #e0e7ff;
            padding: 15px;
            background: white;
            box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
          }
          
          .char-counter {
            font-size: 0.8rem;
            font-weight: 500;
            margin-top: 5px;
            transition: color 0.3s ease;
          }
          
          .char-counter.warning {
            color: #ff4757;
            font-weight: 600;
          }
          
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(8px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes pulse {
            0% {
              transform: scale(0.8);
              opacity: 0.7;
            }
            50% {
              transform: scale(1);
              opacity: 1;
            }
            100% {
              transform: scale(0.8);
              opacity: 0.7;
            }
          }
          
          /* Scrollbar */
          .messages-container::-webkit-scrollbar {
            width: 6px;
          }
          
          .messages-container::-webkit-scrollbar-track {
            background: rgba(224, 231, 255, 0.3);
            border-radius: 3px;
          }
          
          .messages-container::-webkit-scrollbar-thumb {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 3px;
          }
          
          .messages-container::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
          }
          
          /* Input focus */
          .form-control:focus {
            border-color: #667eea;
            box-shadow: 0 0 0 0.25rem rgba(102, 126, 234, 0.25);
          }
          
          .send-btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border: none;
            transition: all 0.3s ease;
          }
          
          .send-btn:hover:not(:disabled) {
            transform: translateY(-1px);
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
          }
          
          .send-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }
          
          /* Responsive */
          @media (max-width: 768px) {
            .messages-container {
              padding: 15px;
            }
            
            .message-bubble {
              max-width: 90%;
              padding: 8px 12px;
            }
            
            .input-container {
              padding: 12px;
            }
          }
        `}
      </style>

      <div className="chatbox-container">
        <div className="messages-container">
          {loading ? (
            <div className="loading-container">
              <div className="spinner-pulse"></div>
              <p className="text-muted">Chargement des messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                {taskId ? '📋' : '💬'}
              </div>
              <h6 className="text-muted mb-2">
                {taskId ? 'Aucun message pour cette tâche' : 'Aucun message pour le moment'}
              </h6>
              <p className="small text-muted">
                {taskId 
                  ? 'Soyez le premier à discuter sur cette tâche !' 
                  : 'Soyez le premier à écrire dans le chat !'
                }
              </p>
            </div>
          ) : (
            <>
              {messages.map((msg) => {
                const isUser = msg.sender._id === user.id;
                const roleClass = msg.sender.role === 'superAdmin' ? 'role-superAdmin' : 
                                msg.sender.role === 'admin' ? 'role-admin' : 'role-user';
                const roleText = msg.sender.role === 'superAdmin' ? 'SUPER ADMIN' : 
                               msg.sender.role === 'admin' ? 'ADMIN' : 'MEMBRE';
                
                return (
                  <div
                    key={msg._id}
                    className={`d-flex ${isUser ? 'justify-content-end' : 'justify-content-start'}`}
                  >
                    <div className={`message-bubble ${isUser ? 'user' : 'other'}`}>
                      <div className="message-header">
                        <span>{getMessageEmoji(msg.sender.role, msg.content)}</span>
                        <span className="message-sender">
                          {isUser ? 'Vous' : msg.sender.name}
                        </span>
                        {!isUser && (
                          <span className={`message-role ${roleClass}`}>
                            {roleText}
                          </span>
                        )}
                      </div>
                      
                      <div className="message-content">
                        {msg.content}
                      </div>
                      
                      <div className="message-time">
                        {new Date(msg.createdAt).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        <div className="input-container">
          <form onSubmit={sendMessage}>
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder="Écrire un message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                maxLength={500}
              />
              <button 
                className="btn send-btn text-white" 
                type="submit"
                disabled={!newMessage.trim()}
              >
                <i className="fas fa-paper-plane me-1"></i> Envoyer
              </button>
            </div>
            <div className="text-end">
              <small className={`char-counter ${500 - newMessage.length < 50 ? 'warning' : 'text-muted'}`}>
                {500 - newMessage.length} caractères restants
              </small>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default ChatBox;