const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
    getAllUsers,
    updateUser,
    toggleActive,
    deleteUser,
} = require('../controllers/userController');

//  connecté + rôle admin/superAdmin
router.get('/', protect, admin('admin', 'superAdmin'), getAllUsers);
router.put('/:id', protect, admin('admin', 'superAdmin'), updateUser);
router.patch('/:id/toggle-active', protect, admin('admin', 'superAdmin'), toggleActive);
router.delete('/:id', protect, admin('superAdmin'), deleteUser);
module.exports = router;