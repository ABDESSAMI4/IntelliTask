const User = require('../models/User');

/**
 * ============================================
 * PERMISSION RULES
 * ============================================
 * SuperAdmin: Accès complet
 * Admin: Gestion opérationnelle (tâches, utilisateurs User uniquement)
 *        ❌ Ne peut pas modifier/supprimer SuperAdmin
 *        ❌ Ne peut pas créer Admin/SuperAdmin
 */

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

// Mettre à jour un utilisateur (avec vérifications de rôle)
/**
 * Règles:
 * - SuperAdmin: peut modifier tous les utilisateurs
 * - Admin: peut modifier User uniquement, PAS SuperAdmin/Admin
 */
exports.updateUser = async(req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

        // Vérifier si on essaie de modifier un SuperAdmin
        if (user.role === 'superAdmin' && req.user.role !== 'superAdmin') {
            return res.status(403).json({
                message: 'Impossible de modifier un SuperAdmin. Seul un SuperAdmin peut faire cela.',
                forbidden: true
            });
        }

        // Vérifier si on essaie de modifier un Admin (si on est Admin soi-même)
        if (user.role === 'admin' && req.user.role === 'admin') {
            return res.status(403).json({
                message: 'Impossible de modifier un Admin. Seul un SuperAdmin peut faire cela.',
                forbidden: true
            });
        }

        // Vérifier si on essaie de changer le rôle en SuperAdmin/Admin (pour non-SuperAdmin)
        if (req.body.role && req.user.role !== 'superAdmin') {
            if (req.body.role === 'superAdmin' || req.body.role === 'admin') {
                return res.status(403).json({
                    message: 'Impossible de créer Admin/SuperAdmin. Seul un SuperAdmin peut faire cela.',
                    forbidden: true
                });
            }
        }

        const updatedFields = {...req.body };
        // Ne pas permettre à un Admin de modifier les champs critiques
        if (req.user.role === 'admin' && req.body.role) {
            return res.status(403).json({
                message: 'Vous ne pouvez pas modifier les rôles.',
                forbidden: true
            });
        }

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
/**
 * Règles:
 * - SuperAdmin: peut activer/désactiver tous
 * - Admin: peut activer/désactiver User uniquement
 */
exports.toggleActive = async(req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

        if (user.role === 'superAdmin') {
            return res.status(403).json({
                message: 'Impossible de désactiver un SuperAdmin.',
                forbidden: true
            });
        }

        if (user.role === 'admin' && req.user.role === 'admin') {
            return res.status(403).json({
                message: 'Impossible de désactiver un Admin. Seul un SuperAdmin peut faire cela.',
                forbidden: true
            });
        }

        user.active = !user.active;
        await user.save();

        res.json({ message: `Utilisateur ${user.active ? 'activé' : 'désactivé'}` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// Supprimer un utilisateur
/**
 * Règles:
 * - SuperAdmin: peut supprimer Admin et User
 * - Admin: peut supprimer User uniquement
 */
exports.deleteUser = async(req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

        if (user.role === 'superAdmin') {
            return res.status(403).json({
                message: 'Impossible de supprimer un SuperAdmin.',
                forbidden: true
            });
        }

        if (user.role === 'admin' && req.user.role === 'admin') {
            return res.status(403).json({
                message: 'Impossible de supprimer un Admin. Seul un SuperAdmin peut faire cela.',
                forbidden: true
            });
        }

        await user.deleteOne();
        res.json({ message: 'Utilisateur supprimé définitivement' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// Créer un utilisateur (auditeur/admin)
/**
 * Règles:
 * - SuperAdmin: peut créer User, Admin, SuperAdmin
 * - Admin: peut créer User uniquement
 */
exports.createAuditor = async(req, res) => {
    try {
        const {
            name,
            email,
            password,
            role = 'user',
            specialty,
            grade,
            diplomas = [],
            formations = []
        } = req.body;

        // Validation des paramètres
        if (!name || name.length === 0) {
            return res.status(400).json({ message: 'Le nom complet est obligatoire' });
        }

        if (!email || email.length === 0) {
            return res.status(400).json({ message: 'L\'email est obligatoire' });
        }

        if (!password || password.length < 6) {
            return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 6 caractères' });
        }

        // Vérifier les permissions de création de rôles
        if (role !== 'user') {
            if (req.user.role !== 'superAdmin') {
                return res.status(403).json({
                    message: `Impossible de créer un ${role}. Seul un SuperAdmin peut créer des Admin/SuperAdmin.`,
                    forbidden: true
                });
            }
        }

        // Vérifier unicité email
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'Cet email est déjà utilisé' });
        }

        // Création
        const newUser = await User.create({
            name,
            email,
            password,
            role: role || 'user',
            specialty: specialty || null,
            grade: grade || null,
            diplomas: Array.isArray(diplomas) ? diplomas : [],
            formations: Array.isArray(formations) ? formations : [],
            active: true
        });

        res.status(201).json({
            message: 'Utilisateur créé avec succès',
            user: {
                _id: newUser._id,
                name: newUser.name,
                email: newUser.email,
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
        console.error('Erreur lors de la création de l\'utilisateur :', error);

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

// Changer le rôle d'un utilisateur
/**
 * Règles:
 * - SuperAdmin: peut changer tous les rôles
 * - Admin: ❌ Ne peut pas changer les rôles
 */
exports.changeUserRole = async(req, res) => {
    try {
        // Vérifier que l'utilisateur est SuperAdmin
        if (req.user.role !== 'superAdmin') {
            return res.status(403).json({
                message: 'Seul un SuperAdmin peut modifier les rôles.',
                forbidden: true
            });
        }

        const { newRole } = req.body;
        if (!newRole || !['superAdmin', 'admin', 'user'].includes(newRole)) {
            return res.status(400).json({ message: 'Rôle invalide' });
        }

        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

        if (user.role === 'superAdmin' && newRole !== 'superAdmin') {
            return res.status(403).json({
                message: 'Impossible de retirer le rôle SuperAdmin. Seul un SuperAdmin peut le faire.',
                forbidden: true
            });
        }

        user.role = newRole;
        await user.save();

        res.json({
            message: `Rôle changé en ${newRole}`,
            user: {...user._doc, password: undefined }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};