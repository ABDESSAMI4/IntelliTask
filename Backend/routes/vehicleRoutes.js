const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
    getVehicles,
    getAvailableVehicles,
    createVehicle,
    updateVehicle,
    deleteVehicle
} = require('../controllers/vehicleController');

router.get('/', protect, getVehicles);
router.get('/available', protect, getAvailableVehicles); // Bonus très utile
router.post('/', protect, admin('admin', 'superAdmin'), createVehicle);
router.put('/:id', protect, admin('admin', 'superAdmin'), updateVehicle);
router.delete('/:id', protect, admin('admin', 'superAdmin'), deleteVehicle);

module.exports = router;