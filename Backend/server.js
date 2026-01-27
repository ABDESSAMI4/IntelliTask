// server.js - Version complète corrigée (ajout routes users et notifications)
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cloudinary = require('cloudinary').v2;
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

// AJOUT POUR LE CRON (auto-refus 24h)
const cron = require('node-cron');
const Assignment = require('./models/Assignment');
const Task = require('./models/Task');

// Connexion MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log('MongoDB connecté')).catch(err => console.error('Erreur MongoDB:', err));

// Cloudinary config (si tu l'utilises)
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Express app
const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CORS (autorise frontend local + prod)
const allowedOrigins = [
    'http://localhost:3000',
    'https://ton-frontend.onrender.com' // ajoute ton frontend Render
];
app.use(cors({
    origin: function(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

// Routes – AJOUT MANQUANT ICI !
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes')); // ← Ajoute ça !
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes')); // ← Ajoute ça !
app.use('/api/vehicles', require('./routes/vehicleRoutes'));
app.use('/api/vehicle-requests', require('./routes/vehicleRequestRoutes'));
app.use('/api/vehicle-assignments', require('./routes/vehicleAssignmentRoutes'));
app.use('/api/history', require('./routes/historyRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/assignments', require('./routes/assignmentRoutes'));

// Socket.io
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST'],
        credentials: true
    }
});

io.on('connection', (socket) => {
    console.log('Socket connecté:', socket.id);
    socket.on('joinUserRoom', (userId) => {
        socket.join(`user_${userId}`);
        console.log(`User ${userId} joined room user_${userId}`);
    });
    // ... autres events
});

// CRON auto-refus assignments (24h)
cron.schedule('0 * * * *', async() => {
    try {
        const expired = await Assignment.find({
            status: 'pending',
            createdAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        });

        for (const ass of expired) {
            ass.status = 'refused';
            ass.justification = '(Auto-refus : pas de réponse dans 24h)';
            await ass.save();
            // Notification + email
        }
        console.log(`Auto-refus : ${expired.length} assignments`);
    } catch (err) {
        console.error('Erreur CRON auto-refus:', err);
    }
});

// =========================

const PORT = process.env.PORT || 5000;

server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Serveur IntelliTask démarré sur http://localhost:${PORT}`);
    console.log(`🔌 Socket.io actif et prêt pour les notifications live`);
    console.log(`📅 Date de démarrage : ${new Date().toLocaleString('fr-FR')}`);
    console.log(`🌍 Frontend autorisé : ${allowedOrigins.join(', ')}`);
});