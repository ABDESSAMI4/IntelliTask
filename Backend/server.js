require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cloudinary = require('cloudinary').v2;
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

// Pour le cron (auto-refus après 24h)
const cron = require('node-cron');
const Assignment = require('./models/Assignment');
const Task = require('./models/Task');
const User = require('./models/User');
const sendNotification = require('./utils/notification');

// ────────────────────────────────────────────────────────────────
// Vérification des variables d'environnement obligatoires
// ────────────────────────────────────────────────────────────────
const requiredEnv = ['JWT_SECRET', 'MONGO_URI', 'PORT'];
const missing = requiredEnv.filter(key => !process.env[key]);
if (missing.length > 0) {
    console.error('❌ Variables manquantes :', missing.join(', '));
    process.exit(1);
}

// ────────────────────────────────────────────────────────────────
// Initialisation de l'application Express
// ────────────────────────────────────────────────────────────────
const app = express();

// Configuration Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
console.log('🔑 Cloudinary configuré avec succès');

// Middleware JSON (limite augmentée pour les fichiers base64)
app.use(express.json({ limit: '10mb' }));

// Liste des origines autorisées pour CORS
const allowedOrigins = [
    'http://localhost:3000',
    'https://intelli-task-t3cz.vercel.app',
];

// Configuration CORS
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
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

// ────────────────────────────────────────────────────────────────
// Routes de l’API
// ────────────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/vehicles', require('./routes/vehicleRoutes'));
app.use('/api/assignments', require('./routes/assignmentRoutes'));
app.use('/api/history', require('./routes/historyRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/vehicle-assignments', require('./routes/vehicleAssignmentRoutes'));
app.use('/api/vehicle-requests', require('./routes/vehicleRequestRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));

// Dossier statique pour les uploads (si tu en utilises)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Route de test racine
app.get('/', (req, res) => {
    res.status(200).json({
        message: '🚀 API IntelliTask est en marche !',
        status: 'online',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
    });
});

// ────────────────────────────────────────────────────────────────
// NOUVELLE ROUTE : Liste des auditeurs pour la délégation
// Accessible à tous les utilisateurs connectés (via protect)
// ────────────────────────────────────────────────────────────────
const { protect } = require('./middleware/authMiddleware');

app.get('/api/users/auditors', protect, async(req, res) => {
    try {
        const auditors = await User.find({
                role: 'user',
                active: true,
                _id: { $ne: req.user._id }, // exclure soi-même
            })
            .select('name email specialty grade phone active')
            .sort('name');

        res.status(200).json(auditors);
    } catch (error) {
        console.error('Erreur /api/users/auditors :', error);
        res.status(500).json({
            message: 'Erreur serveur lors du chargement des auditeurs',
            ...(process.env.NODE_ENV === 'development' && { error: error.message }),
        });
    }
});

// ────────────────────────────────────────────────────────────────
// Gestion des routes non trouvées (404)
// ────────────────────────────────────────────────────────────────
app.use('*', (req, res) => {
    res.status(404).json({
        message: 'Route non trouvée',
        path: req.originalUrl,
        method: req.method,
    });
});

// ────────────────────────────────────────────────────────────────
// Connexion MongoDB
// ────────────────────────────────────────────────────────────────
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB connecté avec succès'))
    .catch((err) => {
        console.error('❌ Erreur connexion MongoDB :', err.message);
        process.exit(1);
    });

// ────────────────────────────────────────────────────────────────
// Socket.io
// ────────────────────────────────────────────────────────────────
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
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

app.set('io', io);

// ────────────────────────────────────────────────────────────────
// CRON : Auto-refus des tâches pending après 24h
// Exécuté toutes les heures
// ────────────────────────────────────────────────────────────────
cron.schedule('0 * * * *', async() => {
    console.log('Cron : vérification tâches pending > 24h');

    try {
        const pending = await Assignment.find({
            status: 'pending',
            createdAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        }).populate('taskId');

        for (const ass of pending) {
            ass.status = 'refused';
            ass.justification = 'Délai de 24h dépassé sans réponse';
            await ass.save();

            const task = ass.taskId;
            task.assignedTo = [{ user: task.createdBy, status: 'refused' }];
            await task.save();

            const creator = await User.findById(task.createdBy);
            if (creator) {
                sendNotification(
                    creator,
                    `Tâche "${task.name}" refusée automatiquement (délai dépassé). Retournée à vous.`,
                    'email'
                );
            }

            console.log(`Tâche ${task._id} refusée auto + retournée à créateur`);
        }
    } catch (error) {
        console.error('Erreur dans le cron auto-refus :', error);
    }
});

// ────────────────────────────────────────────────────────────────
// Gestion globale des erreurs
// ────────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error('🚨 Erreur serveur :', err);

    res.status(err.status || 500).json({
        message: err.message || 'Erreur interne du serveur',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
});

// ────────────────────────────────────────────────────────────────
// Lancement du serveur
// ────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Serveur IntelliTask démarré sur http://localhost:${PORT}`);
    console.log(`🔌 Socket.io actif et prêt pour les notifications live`);
    console.log(`📅 Date de démarrage : ${new Date().toLocaleString('fr-FR')}`);
    console.log(`🌍 Frontend autorisé : ${allowedOrigins.join(', ')}`);
});