const express = require('express');
const router = express.Router();

// Middlewares
const { protect, admin } = require('../middleware/authMiddleware');
const { register, } = require('../controllers/authController');

// Controller functions
const {
    getAllUsers,
    updateUser,
    toggleActive,
    deleteUser,

} = require('../controllers/userController');

// Routes protégées admin/superAdmin
router.get('/', protect, admin('admin', 'superAdmin'), getAllUsers);
router.put('/:id', protect, admin('admin', 'superAdmin'), updateUser);
router.patch('/:id/toggle-active', protect, admin('admin', 'superAdmin'), toggleActive);
router.delete('/:id', protect, admin('superAdmin'), deleteUser);

// Route création auditeur (protégée admin/superAdmin)
//router.post('/create-auditor', protect, admin(['admin', 'superAdmin']), createAuditor);
router.post('/register', register);

module.exports = router;