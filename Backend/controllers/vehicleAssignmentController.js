const VehicleAssignment = require('../models/VehicleAssignment');
const Vehicle = require('../models/Vehicle');

const isVehicleAvailable = async(vehicleId, dateDebut, dateFin, excludeId = null) => {
    const query = {
        vehicle: vehicleId,
        statut: { $in: ['planifiée', 'en_cours'] },
        dateDebut: { $lt: dateFin || new Date(8640000000000000) },
        $or: [{ dateFin: null }, { dateFin: { $gt: dateDebut } }]
    };
    if (excludeId) query._id = { $ne: excludeId };

    const conflicts = await VehicleAssignment.find(query);
    return conflicts.length === 0;
};

exports.getAssignments = async(req, res) => {
    try {
        const assignments = await VehicleAssignment.find()
            .populate('vehicle', 'matricule marque modele')
            .populate('users', 'name email')
            .populate('mission', 'name')
            .sort({ dateDebut: -1 });

        res.json(assignments);
    } catch (error) {
        console.error('Erreur getAssignments:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

exports.createAssignment = async(req, res) => {
    try {
        const { vehicle, users, mission, type, dateDebut, dateFin, direction, notes } = req.body;

        if (!vehicle || !users || !Array.isArray(users) || users.length === 0 || !type || !dateDebut) {
            return res.status(400).json({ message: 'Données requises manquantes' });
        }

        if (type === 'partagée' && users.length < 2) {
            return res.status(400).json({ message: 'Au moins 2 utilisateurs pour une attribution partagée' });
        }

        const available = await isVehicleAvailable(vehicle, new Date(dateDebut), dateFin ? new Date(dateFin) : null);
        if (!available) {
            return res.status(400).json({ message: 'Véhicule non disponible sur cette période' });
        }

        const assignment = await VehicleAssignment.create({
            vehicle,
            users,
            mission: mission || null,
            type,
            dateDebut: new Date(dateDebut),
            dateFin: dateFin ? new Date(dateFin) : null,
            direction: direction || '',
            notes: notes || '',
            statut: 'planifiée'
        });

        await assignment.populate('vehicle', 'matricule marque modele');
        await assignment.populate('users', 'name email');


        const io = req.app.get('io');
        if (io) {
            users.forEach(userId => {
                io.to(`user_${userId}`).emit('newVehicleAssignment', {
                    message: `Nouvelle attribution véhicule le ${new Date(dateDebut).toLocaleDateString()}`,
                    assignment
                });
            });
        }

        res.status(201).json(assignment);
    } catch (error) {
        console.error('Erreur createAssignment:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

exports.updateAssignment = async(req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const assignment = await VehicleAssignment.findById(id);
        if (!assignment) return res.status(404).json({ message: 'Attribution non trouvée' });

        if (updates.dateDebut || updates.dateFin || updates.vehicle) {
            const newVehicle = updates.vehicle || assignment.vehicle;
            const newStart = updates.dateDebut ? new Date(updates.dateDebut) : assignment.dateDebut;
            const newEnd = updates.dateFin ? new Date(updates.dateFin) : assignment.dateFin;

            const available = await isVehicleAvailable(newVehicle, newStart, newEnd, assignment._id);
            if (!available) {
                return res.status(400).json({ message: 'Conflit de disponibilité sur les nouvelles dates/véhicule' });
            }
        }

        Object.assign(assignment, updates);
        await assignment.save();

        await assignment.populate('vehicle', 'matricule marque modele');
        await assignment.populate('users', 'name email');

        res.json(assignment);
    } catch (error) {
        console.error('Erreur updateAssignment:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

exports.deleteAssignment = async(req, res) => {
    try {
        const { id } = req.params;
        const assignment = await VehicleAssignment.findByIdAndDelete(id);
        if (!assignment) return res.status(404).json({ message: 'Attribution non trouvée' });

        res.json({ message: 'Attribution supprimée' });
    } catch (error) {
        console.error('Erreur deleteAssignment:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};