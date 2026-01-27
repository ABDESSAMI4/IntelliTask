const express = require('express');
const router = express.Router();

// Middlewares
const { protect, admin } = require('../middleware/authMiddleware');
const { register } = require('../controllers/authController'); // ← Import register depuis authController

// Controller functions
const {
    getAllUsers,
    updateUser,
    toggleActive,
    deleteUser,
} = require('../controllers/userController');

// Routes protégées admin/superAdmin
router.get('/', protect, admin(['admin', 'superAdmin']), getAllUsers); // ← superAdmin autorisé ici
router.put('/:id', protect, admin(['admin', 'superAdmin']), updateUser);
router.patch('/:id/toggle-active', protect, admin(['admin', 'superAdmin']), toggleActive);
router.delete('/:id', protect, admin(['superAdmin']), deleteUser); // ← Seulement superAdmin pour delete

// Route création auditeur (publique ou protégée, selon ton choix)
// Si tu veux la rendre publique : router.post('/register', register);
// Si protégée admin/superAdmin : router.post('/register', protect, admin(['admin', 'superAdmin']), register);

router.post('/register', register); // ← Actuel : publique (comme dans ton code)

module.exports = router;