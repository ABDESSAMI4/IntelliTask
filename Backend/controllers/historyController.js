const Assignment = require('../models/Assignment');
const VehicleRequest = require('../models/VehicleRequest');
const VehicleAssignment = require('../models/VehicleAssignment');


exports.getUserHistory = async(req, res) => {
    try {
        const userId = req.params.userId || req.user._id;

        const history = await Assignment.find({ userId })
            .populate('taskId', 'name description startDate endDate type remunerated')
            .sort({ respondedAt: -1, createdAt: -1 });

        res.json(history);
    } catch (error) {
        console.error('Erreur chargement historique personnel :', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// Historique global tâches
exports.getGlobalHistory = async(req, res) => {
    try {
        const history = await Assignment.find({})
            .populate('taskId', 'name description')
            .populate('userId', 'name email')
            .sort({ respondedAt: -1, createdAt: -1 });

        res.json(history);
    } catch (error) {
        console.error('Erreur historique global :', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

//  Historique véhicules personnel
exports.getUserVehicleHistory = async(req, res) => {
    try {
        const userId = req.params.userId || req.user._id;

        const requests = await VehicleRequest.find({ user: userId })
            .populate('vehicle', 'matricule marque modele')
            .sort({ respondedAt: -1, createdAt: -1 });

        const assignments = await VehicleAssignment.find({ users: userId })
            .populate('vehicle', 'matricule marque modele')
            .populate('mission', 'name description')
            .sort({ returnedAt: -1, createdAt: -1 });

        const combined = [
            ...requests.map(r => ({ type: 'request', ...r.toObject() })),
            ...assignments.map(a => ({ type: 'assignment', ...a.toObject() }))
        ].sort((a, b) => new Date(b.respondedAt || b.createdAt) - new Date(a.respondedAt || a.createdAt));

        res.json(combined);
    } catch (error) {
        console.error('Erreur historique véhicules personnel :', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

//  Historique véhicules global
exports.getGlobalVehicleHistory = async(req, res) => {
    try {
        const requests = await VehicleRequest.find({})
            .populate('vehicle', 'matricule marque modele')
            .populate('user', 'name email')
            .sort({ respondedAt: -1, createdAt: -1 });

        const assignments = await VehicleAssignment.find({})
            .populate('vehicle', 'matricule marque modele')
            .populate('users', 'name email')
            .populate('mission', 'name description')
            .sort({ returnedAt: -1, createdAt: -1 });

        const combined = [
            ...requests.map(r => ({ type: 'request', ...r.toObject() })),
            ...assignments.map(a => ({ type: 'assignment', ...a.toObject() }))
        ].sort((a, b) => new Date(b.respondedAt || b.returnedAt || b.createdAt) - new Date(a.respondedAt || a.returnedAt || a.createdAt));

        res.json(combined);
    } catch (error) {
        console.error('Erreur historique véhicules global :', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};