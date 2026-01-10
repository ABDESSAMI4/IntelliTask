
import { useState, useEffect, useContext, useRef } from 'react';
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
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };


  const getMessageEmoji = (senderRole, content) => {
    const lower = content.toLowerCase();

    // Rôles spéciaux
    if (senderRole === 'superAdmin') return '👑';
    if (senderRole === 'admin') return '🛡️';

    // Selon le contenu
    if (lower.includes('bonjour') || lower.includes('salut') || lower.includes('hi')) return '👋';
    if (lower.includes('merci') || lower.includes('thanks')) return '🙏';
    if (lower.includes('super') || lower.includes('parfait') || lower.includes('top') || lower.includes('génial')) return '🎉';
    if (lower.includes('ok') || lower.includes('d\'accord') || lower.includes('yes')) return '✅';
    if (lower.includes('?')) return '🤔';
    if (lower.includes('!') || lower.includes('incroyable') || lower.includes('cool')) return '🚀';
    if (lower.includes('haha') || lower.includes('lol') || lower.includes('mdr')) return '😂';
    if (lower.includes('triste') || lower.includes('dommage')) return '😔';

    // Emoji aléatoire si rien ne matche (pour la joie !)
    const randomEmojis = ['🌟', ' ',];
    return randomEmojis[Math.floor(Math.random() * randomEmojis.length)];
  };

  const fetchMessages = async () => {
    try {
      const endpoint = taskId ? `/messages/task/${taskId}` : '/messages/global';
      const res = await API.get(endpoint);
      setMessages(res.data);
      setLoading(false);
      scrollToBottom();
    } catch (err) {
      toast.error('Erreur chargement messages');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();

    socket.on('newMessage', (message) => {
      if ((taskId && message.task?._id === taskId) || (!taskId && !message.task)) {
        setMessages(prev => [...prev, message]);
        scrollToBottom();
      }
    });

    return () => socket.off('newMessage');
  }, [taskId]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await API.post('/messages', { content: newMessage, taskId });
      setNewMessage('');
    } catch (err) {
      toast.error('Erreur envoi');
    }
  };

  return (
    <div className="card shadow h-100 d-flex flex-column">
      <div className="card-header bg-primary text-white text-center">
        <h6 className="mb-0 fw-bold">
          {taskId ? 'Discussion sur la tâche' : 'Chat général'}
        </h6>
      </div>

      <div className="card-body flex-grow-1 overflow-auto p-3">
        {loading ? (
          <p className="text-center text-muted my-5">Chargement des messages...</p>
        ) : messages.length === 0 ? (
          <p className="text-center text-muted my-5">
            {taskId ? 'Aucun message pour cette tâche' : 'Soyez le premier à écrire ! 😊'}
          </p>
        ) : (
          <>
            {messages.map(msg => (
              <div
                key={msg._id}
                className={`mb-4 d-flex ${msg.sender._id === user.id ? 'justify-content-end' : 'justify-content-start'}`}
              >
                <div
                  className={`max-w-75 p-3 rounded-3 shadow-sm ${
                    msg.sender._id === user.id
                      ? 'bg-primary text-white'
                      : 'bg-light text-dark border'
                  }`}
                >
                  <div className="d-flex align-items-center mb-1">
                    <span className="fs-4 me-2">
                      {getMessageEmoji(msg.sender.role, msg.content)}
                    </span>
                    <strong className="fs-6">
                      {msg.sender._id === user.id ? 'Vous' : msg.sender.name}
                    </strong>
                  </div>
                  <div className="mb-1">{msg.content}</div>
                  <small className={`d-block text-end ${msg.sender._id === user.id ? 'text-white-50' : 'text-muted'}`}>
                    {new Date(msg.createdAt).toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </small>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <form onSubmit={sendMessage} className="border-top p-3 bg-white">
        <div className="input-group">
          <input
            type="text"
            className="form-control form-control-lg border-primary"
            placeholder="Écrire un message... 😊"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            maxLength="500"
          />
          <button type="submit" className="btn btn-primary btn-lg px-4">
            Envoyer 🚀
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatBox;