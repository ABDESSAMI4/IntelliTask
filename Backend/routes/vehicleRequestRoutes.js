const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { protect, admin } = require('../middleware/authMiddleware');
const VehicleRequest = require('../models/VehicleRequest');
const VehicleAssignment = require('../models/VehicleAssignment');
const Vehicle = require('../models/Vehicle');

// vérification disponibilité véhicule
const isVehicleAvailable = async(vehicleId, dateDebut, dateFin) => {
    try {
        const query = {
            vehicle: vehicleId,
            statut: { $in: ['planifiée', 'en_cours'] },
            dateDebut: { $lt: dateFin || new Date(8640000000000000) },
            $or: [{ dateFin: null }, { dateFin: { $gt: dateDebut } }]
        };

        const conflicts = await VehicleAssignment.find(query);
        return conflicts.length === 0;
    } catch (err) {
        console.error('Erreur isVehicleAvailable:', err);
        return false;
    }
};

//  validation format date
const isValidDate = (dateStr) => {
    if (!dateStr) return true;
    const date = new Date(dateStr);
    return date instanceof Date && !isNaN(date);
};

// 1. Créer une demande 
router.post('/', protect, async(req, res) => {
    try {
        const { vehicle, dateDebut, dateFin, direction, notes } = req.body;


        if (!vehicle || !dateDebut) {
            return res.status(400).json({
                message: 'Véhicule et date de début sont obligatoires.'
            });
        }


        if (!isValidDate(dateDebut) || (dateFin && !isValidDate(dateFin))) {
            return res.status(400).json({
                message: 'Format de date invalide (utilisez YYYY-MM-DD).'
            });
        }


        if (!mongoose.Types.ObjectId.isValid(vehicle)) {
            return res.status(400).json({
                message: 'ID du véhicule invalide.'
            });
        }

        // Vérifier existence véhicule
        const vehicleDoc = await Vehicle.findById(vehicle);
        if (!vehicleDoc) {
            return res.status(404).json({
                message: 'Véhicule non trouvé dans le parc.'
            });
        }

        // Création de la demande
        const request = await VehicleRequest.create({
            user: req.user._id,
            vehicle: vehicleDoc._id,
            dateDebut: new Date(dateDebut),
            dateFin: dateFin ? new Date(dateFin) : null,
            direction: direction || '',
            notes: notes || '',
            status: 'en_attente'
        });


        await request.populate('user', 'name email');
        await request.populate('vehicle', 'matricule marque modele');

        // Notification realtime aux admins
        const io = req.app.get('io');
        if (io) {
            io.emit('newVehicleRequest', {
                message: `Nouvelle demande de véhicule de ${req.user.name}`,
                vehicle: request.vehicle.matricule,
                dates: new Date(dateDebut).toLocaleDateString('fr-FR'),
                requestId: request._id
            });
        }

        return res.status(201).json({
            message: 'Demande de véhicule envoyée avec succès ! En attente de validation.',
            request
        });
    } catch (error) {
        console.error('Erreur création demande véhicule:', error);
        return res.status(500).json({
            message: 'Erreur serveur lors de la création de la demande.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// 2. Lister toutes les demandes (admin uniquement)
router.get('/', protect, admin('admin', 'superAdmin'), async(req, res) => {
    try {
        const requests = await VehicleRequest.find({})
            .populate('user', 'name email')
            .populate('vehicle', 'matricule marque modele type carburant')
            .populate('respondedBy', 'name')
            .sort({ createdAt: -1 });

        res.json(requests);
    } catch (error) {
        console.error('Erreur liste demandes:', error);
        res.status(500).json({ message: 'Erreur serveur.' });
    }
});

// 3. Répondre à une demande (admin uniquement)
router.patch('/:id/response', protect, admin('admin', 'superAdmin'), async(req, res) => {
    try {
        const { status, justification } = req.body;

        if (!['acceptée', 'refusée'].includes(status)) {
            return res.status(400).json({ message: 'Statut invalide (acceptée ou refusée).' });
        }

        const request = await VehicleRequest.findById(req.params.id)
            .populate('user', 'name email')
            .populate('vehicle', 'matricule marque modele');

        if (!request) {
            return res.status(404).json({ message: 'Demande non trouvée.' });
        }

        if (request.status !== 'en_attente') {
            return res.status(400).json({ message: 'Cette demande a déjà été traitée.' });
        }

        request.status = status;
        request.respondedBy = req.user._id;
        request.respondedAt = new Date();
        request.justification = status === 'refusée' ? (justification || '') : '';

        if (status === 'acceptée') {
            const available = await isVehicleAvailable(
                request.vehicle._id,
                request.dateDebut,
                request.dateFin
            );

            if (!available) {
                request.status = 'refusée';
                request.justification = 'Véhicule non disponible sur les dates demandées.';
                await request.save();

                const io = req.app.get('io');
                if (io) {
                    io.to(`user_${request.user._id}`).emit('vehicleRequestUpdate', {
                        status: 'refusée',
                        message: 'Véhicule non disponible sur vos dates.'
                    });
                }

                return res.status(400).json({
                    message: 'Conflit : véhicule non disponible. Demande refusée automatiquement.',
                    request
                });
            }

            // Création attribution
            await VehicleAssignment.create({
                vehicle: request.vehicle._id,
                users: [request.user._id],
                type: 'individuelle',
                dateDebut: request.dateDebut,
                dateFin: request.dateFin,
                direction: request.direction || '',
                notes: `Attribution suite à demande acceptée (#${request._id}) par ${req.user.name}`,
                statut: 'planifiée'
            });
        }

        await request.save();

        const io = req.app.get('io');
        if (io) {
            io.to(`user_${request.user._id}`).emit('vehicleRequestUpdate', {
                requestId: request._id,
                status: request.status,
                message: request.status === 'acceptée' ?
                    `Votre demande pour ${request.vehicle.matricule} a été acceptée !` : `Votre demande a été refusée. Motif : ${request.justification || 'Non précisé'}`
            });
        }

        res.json({
            message: status === 'acceptée' ?
                'Demande acceptée et véhicule attribué !' : 'Demande refusée.',
            request
        });
    } catch (error) {
        console.error('Erreur traitement demande:', error);
        res.status(500).json({ message: 'Erreur serveur lors du traitement.' });
    }
});

module.exports = router;