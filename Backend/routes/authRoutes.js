// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { register, login, makeFirstSuperAdmin } = require('../controllers/authController'); // Utiliser le controller corrigé

router.post('/register', register);
router.post('/login', login);
router.post('/make-superadmin', makeFirstSuperAdmin); // Temporaire, sans protect

module.exports = router;