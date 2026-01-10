// backend/server.js - Version finale corrigée, CORS pour Vercel + Render live
require('dotenv').config(); // Chargement des variables d'environnement

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cloudinary = require('cloudinary').v2;
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

// Vérification des variables obligatoires (évite crash silencieux)
const requiredEnv = ['JWT_SECRET', 'MONGO_URI', 'PORT'];
const missing = requiredEnv.filter(key => !process.env[key]);
if (missing.length > 0) {
    console.error('❌ Variables manquantes :', missing.join(', '));
    process.exit(1);
}

const app = express();

// =========================
// CONFIGURATION CLOUDINARY
// =========================
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log('🔑 Cloudinary configuré avec succès');

// =========================
// MIDDLEWARES GLOBAUX
// =========================
app.use(express.json({ limit: '10mb' }));

// CORS unique : autorise localhost (dev) + ton URL Vercel (prod)
const allowedOrigins = [
    'http://localhost:3000',
    'https://intelli-task-peach.vercel.app', // ← TON URL VERCEL ICI
    // Ajoute d'autres domaines si besoin (ex: ton domaine perso)
];

app.use(cors({
    origin: (origin, callback) => {
        // Permet les requêtes sans origin (Postman, curl, etc.)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Non autorisé par CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
    optionsSuccessStatus: 204,
}));

// Servir les fichiers statiques (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// =========================
// ROUTE DE TEST
// =========================
app.get('/', (req, res) => {
    res.status(200).json({
        message: '🚀 API IntelliTask est en marche !',
        status: 'online',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
    });
});

// =========================
// MONTAGE DES ROUTES API
// =========================
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/vehicles', require('./routes/vehicleRoutes'));
app.use('/api/assignments', require('./routes/assignmentRoutes'));
app.use('/api/history', require('./routes/historyRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/vehicle-assignments', require('./routes/vehicleAssignmentRoutes'));
app.use('/api/vehicle-requests', require('./routes/vehicleRequestRoutes'));

// =========================
// 404 – Routes inexistantes
// =========================
app.use('*', (req, res) => {
    res.status(404).json({
        message: 'Route non trouvée',
        path: req.originalUrl,
        method: req.method,
    });
});

// =========================
// CONNEXION MONGODB
// =========================
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB connecté avec succès'))
    .catch((err) => {
        console.error('❌ Erreur connexion MongoDB :', err.message);
        process.exit(1);
    });

// =========================
// SOCKET.IO – CORS corrigé pour Vercel
// =========================
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: allowedOrigins, // ← Utilise la même liste que pour Express CORS
        methods: ['GET', 'POST'],
        credentials: true,
    },
});

io.on('connection', (socket) => {
    console.log('🟢 Client Socket.io connecté :', socket.id);

    socket.on('joinUserRoom', (userId) => {
        socket.join(`user_${userId}`);
        console.log(`Utilisateur ${userId} a rejoint sa room personnelle`);
    });

    socket.on('disconnect', (reason) => {
        console.log('🔴 Client déconnecté :', socket.id, '| Raison :', reason);
    });
});

// Rendre io accessible dans les controllers
app.set('io', io);

// =========================
// GESTION ERREURS GLOBALES
// =========================
app.use((err, req, res, next) => {
    console.error('🚨 Erreur serveur :', err);

    res.status(err.status || 500).json({
        message: err.message || 'Erreur interne du serveur',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
});

// =========================
// DÉMARRAGE SERVEUR
// =========================
const PORT = process.env.PORT || 5000;

server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Serveur IntelliTask démarré sur http://localhost:${PORT}`);
    console.log(`🔌 Socket.io actif et prêt pour les notifications live`);
    console.log(`📅 Date de démarrage : ${new Date().toLocaleString('fr-FR')}`);
    console.log(`🌍 Frontend autorisé : ${allowedOrigins.join(', ')}`);
});