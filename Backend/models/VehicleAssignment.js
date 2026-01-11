const mongoose = require('mongoose');

const vehicleAssignmentSchema = new mongoose.Schema({
    vehicle: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vehicle',
        required: true
    },
    users: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],
    mission: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
        default: null
    },
    type: {
        type: String,
        enum: ['individuelle', 'partagée'],
        required: true
    },
    dateDebut: { type: Date, required: true },
    dateFin: { type: Date },
    direction: { type: String, default: '' },
    notes: { type: String, default: '' },
    statut: {
        type: String,
        enum: ['planifiée', 'en_cours', 'terminée', 'annulée'],
        default: 'planifiée'
    },
    createdAt: { type: Date, default: Date.now }
});

// Index optimisé pour les requêtes de disponibilité
vehicleAssignmentSchema.index({ vehicle: 1, dateDebut: 1, dateFin: 1 });
vehicleAssignmentSchema.index({ statut: 1 });

module.exports = mongoose.model('VehicleAssignment', vehicleAssignmentSchema);