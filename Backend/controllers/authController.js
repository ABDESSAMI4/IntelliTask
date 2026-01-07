// backend/controllers/authController.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Génération du token avec id ET role
const generateToken = (user) => {
    return jwt.sign({
            id: user._id,
            role: user.role // ← IMPORTANT : on ajoute le rôle dans le token
        },
        process.env.JWT_SECRET, { expiresIn: '30d' }
    );
};

// === ROUTE TEMPORAIRE ===
exports.makeFirstSuperAdmin = async(req, res) => {
    try {
        const firstUser = await User.findOne().sort({ createdAt: 1 });
        if (!firstUser) {
            return res.status(404).json({ message: 'Aucun utilisateur trouvé' });
        }

        firstUser.role = 'superAdmin';
        await firstUser.save();

        res.json({
            message: 'Premier utilisateur élevé au rang de superAdmin avec succès !',
            user: {
                _id: firstUser._id,
                name: firstUser.name,
                email: firstUser.email,
                role: firstUser.role,
            },
        });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// Register
exports.register = async(req, res) => {
    try {
        const {
            name,
            email,
            password,
            specialty,
            grade,
            diplomas = [],
            formations = []
        } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Nom, email et mot de passe sont obligatoires' });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'Cet email est déjà utilisé' });
        }

        const usersCount = await User.countDocuments();
        const role = usersCount === 0 ? 'superAdmin' : 'user';

        const user = await User.create({
            name,
            email,
            password,
            role,
            specialty: specialty || null,
            grade: grade || null,
            diplomas: Array.isArray(diplomas) ? diplomas : [],
            formations: Array.isArray(formations) ? formations : []
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                specialty: user.specialty,
                grade: user.grade,
                token: generateToken(user), // ← on passe l'objet user complet
            });
        }
    } catch (error) {
        console.error('Erreur register :', error);
        res.status(500).json({ message: 'Erreur lors de l’inscription', error: error.message });
    }
};

// Login
exports.login = async(req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (user && (await user.comparePassword(password))) {
            if (!user.active) {
                return res.status(401).json({ message: 'Compte désactivé' });
            }

            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                specialty: user.specialty,
                grade: user.grade,
                token: generateToken(user), // ← on passe l'objet user complet
            });
        } else {
            res.status(401).json({ message: 'Email ou mot de passe incorrect' });
        }
    } catch (error) {
        console.error('Erreur login :', error);
        res.status(500).json({ message: 'Erreur lors de la connexion' });
    }
};