const express = require('express');
const router = express.Router();
const { register, login, makeFirstSuperAdmin } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.post('/make-superadmin', makeFirstSuperAdmin);
module.exports = router;