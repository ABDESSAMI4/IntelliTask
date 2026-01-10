// src/socket.js - Version corrigée pour dev + prod
import io from 'socket.io-client';

// URL dynamique : utilise la même variable que Axios
const SOCKET_URL = process.env.REACT_APP_API_URL ?
    process.env.REACT_APP_API_URL.replace('/api', '') // enlève /api pour Socket
    :
    'http://localhost:5000';

const socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'], // websocket prioritaire
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    withCredentials: true,
});

console.log('Socket connecté à :', SOCKET_URL); // Pour debug

export default socket;