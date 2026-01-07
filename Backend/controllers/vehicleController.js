const Vehicle = require('../models/Vehicle');
const VehicleAssignment = require('../models/VehicleAssignment');

// Helper partagé pour vérifier la disponibilité
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

// Liste tous les véhicules avec statut de disponibilité actuel
exports.getVehicles = async(req, res) => {
    try {
        const vehicles = await Vehicle.find().sort({ createdAt: -1 });

        const vehiclesWithStatus = await Promise.all(
            vehicles.map(async(vehicle) => {
                const currentAssignment = await VehicleAssignment.findOne({
                        vehicle: vehicle._id,
                        statut: { $in: ['planifiée', 'en_cours'] },
                        dateDebut: { $lte: new Date() },
                        $or: [{ dateFin: null }, { dateFin: { $gt: new Date() } }]
                    })
                    .populate('users', 'name email')
                    .sort({ dateDebut: -1 });

                const etat = currentAssignment ? 'Attribué' : 'Disponible';

                return {
                    ...vehicle.toObject(),
                    etat,
                    attributionActuelle: currentAssignment ? {
                        type: currentAssignment.type,
                        users: currentAssignment.users.map(u => u.name).join(', '),
                        direction: currentAssignment.direction,
                        dateDebut: currentAssignment.dateDebut,
                        dateFin: currentAssignment.dateFin
                    } : null
                };
            })
        );

        res.json(vehiclesWithStatus);
    } catch (error) {
        console.error('Erreur getVehicles:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// Endpoint bonus : véhicules disponibles sur une période donnée
exports.getAvailableVehicles = async(req, res) => {
    try {
        const { dateDebut, dateFin } = req.query;
        if (!dateDebut) return res.status(400).json({ message: 'dateDebut requise' });

        const start = new Date(dateDebut);
        const end = dateFin ? new Date(dateFin) : null;

        const allVehicles = await Vehicle.find();
        const available = [];

        for (const vehicle of allVehicles) {
            const available = await isVehicleAvailable(vehicle._id, start, end);
            if (available) available.push(vehicle);
        }

        res.json(available);
    } catch (error) {
        console.error('Erreur getAvailableVehicles:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

exports.createVehicle = async(req, res) => {
    try {
        const { matricule, marque, modele, annee, type, carburant, notes } = req.body;

        if (!matricule || !marque || !modele || !annee) {
            return res.status(400).json({ message: 'Champs obligatoires manquants' });
        }

        const existing = await Vehicle.findOne({ matricule: matricule.toUpperCase().trim() });
        if (existing) return res.status(400).json({ message: 'Matricule déjà utilisé' });

        const vehicle = await Vehicle.create({
            matricule: matricule.toUpperCase().trim(),
            marque,
            modele,
            annee,
            type: type || 'Voiture',
            carburant: carburant || 'Diesel',
            notes
        });

        res.status(201).json(vehicle);
    } catch (error) {
        console.error('Erreur createVehicle:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

exports.updateVehicle = async(req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const vehicle = await Vehicle.findById(id);
        if (!vehicle) return res.status(404).json({ message: 'Véhicule non trouvé' });

        if (updates.matricule && updates.matricule.toUpperCase().trim() !== vehicle.matricule) {
            const existing = await Vehicle.findOne({ matricule: updates.matricule.toUpperCase().trim() });
            if (existing) return res.status(400).json({ message: 'Nouveau matricule déjà utilisé' });
        }

        Object.assign(vehicle, updates);
        await vehicle.save();

        res.json(vehicle);
    } catch (error) {
        console.error('Erreur updateVehicle:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

exports.deleteVehicle = async(req, res) => {
    try {
        const { id } = req.params;

        const hasActive = await VehicleAssignment.findOne({
            vehicle: id,
            statut: { $in: ['planifiée', 'en_cours'] }
        });

        if (hasActive) return res.status(400).json({ message: 'Véhicule actuellement attribué' });

        await Vehicle.findByIdAndDelete(id);
        res.json({ message: 'Véhicule supprimé' });
    } catch (error) {
        console.error('Erreur deleteVehicle:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};