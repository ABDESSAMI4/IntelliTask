// backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const cloudinary = require('cloudinary').v2;
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

// Chargement des variables d'environnement
dotenv.config();

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

// IMPORTANT : express.urlencoded GLOBAL cassait les uploads multipart avec Multer
// On le supprime complètement → Multer gère lui-même le multipart
// app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS précis et sécurisé pour React localhost:3000
app.use(
    cors({
        origin: 'http://localhost:3000',
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
        exposedHeaders: ['Content-Type', 'Authorization'],
        preflightContinue: false,
        optionsSuccessStatus: 204,
    })
);

// Gestion manuelle des preflight si nécessaire
app.options('*', cors());

// Servir les fichiers statiques (si tu en as)
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
// SOCKET.IO
// =========================
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: 'http://localhost:3000',
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

    // Erreur Multer spécifique
    if (err instanceof multer.MulterError) {
        return res.status(400).json({
            message: 'Erreur upload fichier',
            error: err.message,
        });
    }

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
    console.log(`🌍 Frontend autorisé : http://localhost:3000`);
});