// backend/routes/vehicleAssignmentRoutes.js
const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
    getAssignments,
    createAssignment,
    updateAssignment,
    deleteAssignment
} = require('../controllers/vehicleAssignmentController');
const VehicleAssignment = require('../models/VehicleAssignment');

// === Routes Admin ===
router.get('/', protect, getAssignments);
router.post('/', protect, admin('admin', 'superAdmin'), createAssignment);
router.put('/:id', protect, admin('admin', 'superAdmin'), updateAssignment);
router.delete('/:id', protect, admin('admin', 'superAdmin'), deleteAssignment);

// === Nouvelle route : Véhicules attribués à l'utilisateur connecté (auditeur) ===
router.get('/my-vehicles', protect, async(req, res) => {
    try {
        const assignments = await VehicleAssignment.find({
                users: req.user._id,
                statut: { $in: ['planifiée', 'en_cours'] }
            })
            .populate('vehicle', 'matricule marque modele type carburant')
            .populate('users', 'name email')
            .sort({ dateDebut: 1 });

        res.json(assignments);
    } catch (error) {
        console.error('Erreur my-vehicles:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

module.exports = router;