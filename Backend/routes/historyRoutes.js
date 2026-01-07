// backend/routes/historyRoutes.js
const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
    getUserHistory,
    getGlobalHistory,
    getUserVehicleHistory,
    getGlobalVehicleHistory
} = require('../controllers/historyController');

// Historique tâches
router.get('/my', protect, getUserHistory);
router.get('/user/:userId', protect, admin('admin', 'superAdmin'), getUserHistory);
router.get('/global', protect, admin('admin', 'superAdmin'), getGlobalHistory);

// Historique véhicules
router.get('/vehicles/my', protect, getUserVehicleHistory);
router.get('/vehicles/user/:userId', protect, admin('admin', 'superAdmin'), getUserVehicleHistory);
router.get('/vehicles/global', protect, admin('admin', 'superAdmin'), getGlobalVehicleHistory);

module.exports = router;