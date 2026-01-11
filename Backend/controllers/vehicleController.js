const Vehicle = require('../models/Vehicle');
const VehicleAssignment = require('../models/VehicleAssignment');
const VehicleRequest = require('../models/VehicleRequest');
const sendNotification = require('../utils/notification');
const User = require('../models/User');

// Helper partagé pour vérifier la disponibilité d'un véhicule
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

//  Liste tous les véhicules avec statut de disponibilité
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

//  véhicules disponibles sur une période donnée
exports.getAvailableVehicles = async(req, res) => {
    try {
        const { dateDebut, dateFin } = req.query;
        if (!dateDebut) return res.status(400).json({ message: 'dateDebut requise' });

        const start = new Date(dateDebut);
        const end = dateFin ? new Date(dateFin) : null;

        const allVehicles = await Vehicle.find();
        const available = [];

        for (const vehicle of allVehicles) {
            const isAvail = await isVehicleAvailable(vehicle._id, start, end); // ← Correction : isAvail au lieu de available
            if (isAvail) available.push(vehicle);
        }

        res.json(available);
    } catch (error) {
        console.error('Erreur getAvailableVehicles:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

//  Création d'un véhicule (avec notification à l'admin)
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

        // Notification à l'admin (superAdmin)
        const admin = await User.findOne({ role: 'superAdmin' });
        if (admin) {
            await sendNotification(admin,
                `Nouveau véhicule ajouté : ${vehicle.matricule} (${vehicle.marque} ${vehicle.modele})\nPar : ${req.user.name || 'Admin'}`,
                'email'
            );
        }

        res.status(201).json(vehicle);
    } catch (error) {
        console.error('Erreur createVehicle:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// mise à jour d'un véhicule (notification seulement si changement important)
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

        // Mise à jour
        Object.assign(vehicle, updates);
        await vehicle.save();

        // Notification à l'admin seulement si changement majeur (ex: matricule, marque, modele)
        const majorChanges = ['matricule', 'marque', 'modele', 'annee', 'type', 'carburant'];
        const hasMajorChange = majorChanges.some(key => updates[key] !== undefined);

        if (hasMajorChange) {
            const admin = await User.findOne({ role: 'superAdmin' });
            if (admin) {
                await sendNotification(admin,
                    `Véhicule mis à jour (changement majeur) : ${vehicle.matricule} (${vehicle.marque} ${vehicle.modele})`,
                    'email'
                );
            }
        }

        res.json(vehicle);
    } catch (error) {
        console.error('Erreur updateVehicle:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// 5. Suppression d'un véhicule (avec notification)
exports.deleteVehicle = async(req, res) => {
    try {
        const { id } = req.params;

        const hasActive = await VehicleAssignment.findOne({
            vehicle: id,
            statut: { $in: ['planifiée', 'en_cours'] }
        });

        if (hasActive) return res.status(400).json({ message: 'Véhicule actuellement attribué' });

        const vehicle = await Vehicle.findByIdAndDelete(id);

        // Notification à l'admin
        const admin = await User.findOne({ role: 'superAdmin' });
        if (admin && vehicle) {
            await sendNotification(admin,
                `Véhicule supprimé : ${vehicle.matricule} (${vehicle.marque} ${vehicle.modele})`,
                'email'
            );
        }

        res.json({ message: 'Véhicule supprimé' });
    } catch (error) {
        console.error('Erreur deleteVehicle:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};