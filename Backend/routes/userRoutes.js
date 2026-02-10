const express = require('express');
const router = express.Router();

// Middlewares
const { protect, admin } = require('../middleware/authMiddleware');

// Contrôleurs d'authentification
const { register } = require('../controllers/authController');

// Contrôleurs utilisateur
const {
    getAllUsers,
    updateUser,
    toggleActive,
    deleteUser,
    changeUserRole,
} = require('../controllers/userController');

// Modèle User (nécessaire pour la route /auditors)
const User = require('../models/User');

// ────────────────────────────────────────────────────────────────
// Routes protégées (réservées aux admins et superAdmins)
// ────────────────────────────────────────────────────────────────
router.get('/', protect, admin('admin', 'superAdmin'), getAllUsers);
router.put('/:id', protect, admin('admin', 'superAdmin'), updateUser);
router.patch('/:id/toggle-active', protect, admin('admin', 'superAdmin'), toggleActive);
router.delete('/:id', protect, admin('superAdmin'), deleteUser);
router.patch('/:id/change-role', protect, admin('superAdmin'), changeUserRole);

// ────────────────────────────────────────────────────────────────
// Route d'inscription (généralement accessible sans authentification)
// ────────────────────────────────────────────────────────────────
// router.post('/create-auditor', protect, admin(['admin', 'superAdmin']), createAuditor); // commenté
router.post('/register', register);

// ────────────────────────────────────────────────────────────────
// Route pour récupérer la liste des auditeurs actifs (pour délégation)
// Accessible à TOUS les utilisateurs connectés (via protect)
// Exclut l'utilisateur connecté lui-même
// ────────────────────────────────────────────────────────────────
router.get('/auditors', protect, async(req, res) => {
    try {
        const auditors = await User.find({
                role: 'user',
                active: true,
                _id: { $ne: req.user._id }, // ne pas se déléguer à soi-même
            })
            .select('name email specialty grade phone active') // limiter les champs retournés
            .sort('name'); // tri alphabétique par nom

        res.status(200).json(auditors);
    } catch (error) {
        console.error('Erreur route /api/users/auditors :', error);
        res.status(500).json({
            message: 'Erreur serveur lors de la récupération des auditeurs',
            // En développement on peut montrer plus d'infos
            ...(process.env.NODE_ENV === 'development' && { error: error.message }),
        });
    }
});

module.exports = router;