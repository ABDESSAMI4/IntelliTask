const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
    manualAssignment,
    semiAutoAssignment,
    autoAssignment,
    respondToAssignment
} = require('../controllers/assignmentController');
// GET - Affectations actives pour user connecté (pending + accepted)
router.get('/my-assignments', protect, async(req, res) => {
    try {
        const assignments = await require('../models/Assignment')
            .find({
                userId: req.user._id,
                status: { $in: ['pending', 'accepted'] }
            })
            .populate('taskId', 'name description startDate endDate places remunerated remunerationAmount')
            .sort({ createdAt: -1 });

        res.json(assignments);
    } catch (error) {
        console.error('Erreur my-assignments :', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// POST - Assignation manuelle
router.post('/manual', protect, admin('admin', 'superAdmin'), manualAssignment);

// POST - Assignation semi-automatique
router.post('/semi-auto/:taskId', protect, admin('admin', 'superAdmin'), semiAutoAssignment);

// POST - Assignation automatique IA
router.post('/auto/:taskId', protect, admin('admin', 'superAdmin'), autoAssignment);

// PATCH - Réponse à une assignation (user connecté)
router.patch('/response/:assignmentId', protect, respondToAssignment);

// GET - Lister toutes les assignations (admin only)
router.get('/', protect, admin('admin', 'superAdmin'), async(req, res) => {
    try {
        const assignments = await require('../models/Assignment')
            .find()
            .populate('taskId', 'name description')
            .populate('userId', 'name email')
            .sort({ createdAt: -1 });

        res.json(assignments);
    } catch (error) {
        console.error('Erreur GET assignments :', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});
// GET historique complet 
router.get('/my-history', protect, async(req, res) => {
    try {
        const assignments = await Assignment.find({ userId: req.user._id })
            .populate('taskId', 'name description startDate endDate remunerated remunerationAmount')
            .sort({ respondedAt: -1, createdAt: -1 });

        res.json(assignments);
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// GET - user connecté
router.get('/my-pending', protect, async(req, res) => {
    try {
        const assignments = await require('../models/Assignment')
            .find({ userId: req.user._id, status: 'pending' })
            .populate('taskId', 'name description startDate endDate places remunerated remunerationAmount')
            .sort({ createdAt: -1 });

        res.json(assignments);
    } catch (error) {
        console.error('Erreur my-pending :', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

module.exports = router;