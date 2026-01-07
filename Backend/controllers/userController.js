// backend/controllers/userController.js
const User = require('../models/User');

// Lister tous les utilisateurs (admin uniquement)
exports.getAllUsers = async(req, res) => {
    try {
        const users = await User.find({}).select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// Mettre à jour un utilisateur (admin)
exports.updateUser = async(req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

        // Protection : on ne peut pas modifier un superAdmin
        if (user.role === 'superAdmin' && req.user.role !== 'superAdmin') {
            return res.status(403).json({ message: 'Impossible de modifier un superAdmin' });
        }

        const updatedFields = req.body;
        // Si on envoie un nouveau password, il sera hashé automatiquement par le pre('save')

        Object.assign(user, updatedFields);
        await user.save();

        res.json({
            message: 'Utilisateur mis à jour',
            user: {...user._doc, password: undefined },
        });
    } catch (error) {
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
        res.status(500).json({ message: 'Erreur serveur' });
    }
};