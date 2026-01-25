const User = require('../models/User');


// Lister tous les utilisateurs (admin uniquement)
exports.getAllUsers = async(req, res) => {
    try {
        const users = await User.find({}).select('-password');
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// Mettre à jour un utilisateur (admin)
exports.updateUser = async(req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

        if (user.role === 'superAdmin' && req.user.role !== 'superAdmin') {
            return res.status(403).json({ message: 'Impossible de modifier un superAdmin' });
        }

        const updatedFields = req.body;
        Object.assign(user, updatedFields);
        await user.save();

        res.json({
            message: 'Utilisateur mis à jour',
            user: {...user._doc, password: undefined },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// Activer/Désactiver un utilisateur
exports.toggleActive = async(req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

        if (user.role === 'superAdmin') {
            return res.status(403).json({ message: 'Impossible de désactiver un superAdmin' });
        }

        user.active = !user.active;
        await user.save();

        res.json({ message: `Utilisateur ${user.active ? 'activé' : 'désactivé'}` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// Supprimer un utilisateur (superAdmin uniquement)
exports.deleteUser = async(req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

        if (user.role === 'superAdmin') {
            return res.status(403).json({ message: 'Impossible de supprimer un superAdmin' });
        }

        await user.deleteOne();
        res.json({ message: 'Utilisateur supprimé définitivement' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// Créer un auditeur par admin/superAdmin
// Version sans .trim() sur email et autres champs texte
exports.createAuditor = async(req, res) => {
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

        // Validations sans toucher aux espaces
        if (!name || name.length === 0) {
            return res.status(400).json({ message: 'Le nom complet est obligatoire' });
        }

        if (!email || email.length === 0) {
            return res.status(400).json({ message: 'L’email est obligatoire' });
        }

        if (!password || password.length < 6) {
            return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 6 caractères' });
        }

        // Vérification unicité email (sans modifier les espaces)
        // On cherche tel quel (exactement comme reçu)
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'Cet email est déjà utilisé' });
        }

        // Création sans modifier les espaces
        const newUser = await User.create({
            name, // espaces conservés
            email, // espaces conservés (comme ton logiciel l’envoie)
            password,
            role: 'user', // forcé
            specialty: specialty || null,
            grade: grade || null,
            diplomas: Array.isArray(diplomas) ? diplomas : [],
            formations: Array.isArray(formations) ? formations : [],
            active: true
        });

        res.status(201).json({
            message: 'Auditeur créé avec succès',
            user: {
                _id: newUser._id,
                name: newUser.name,
                email: newUser.email, // email exactement comme reçu
                role: newUser.role,
                specialty: newUser.specialty,
                grade: newUser.grade,
                diplomas: newUser.diplomas,
                formations: newUser.formations,
                active: newUser.active,
                createdAt: newUser.createdAt
            }
        });

    } catch (error) {
        console.error('Erreur lors de la création de l\'auditeur :', error);

        if (error.code === 11000) {
            return res.status(400).json({ message: 'Cet email est déjà utilisé (erreur d\'unicité)' });
        }

        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                message: 'Données invalides selon le schéma',
                errors: validationErrors
            });
        }

        res.status(500).json({
            message: 'Erreur serveur interne',
            detail: error.message
        });
    }
};