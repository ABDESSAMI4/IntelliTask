// backend/models/VehicleRequest.js
const mongoose = require('mongoose');

const vehicleRequestSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    vehicle: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vehicle',
        required: true
    },
    dateDebut: {
        type: Date,
        required: true
    },
    dateFin: {
        type: Date
            // Peut être null si usage sur une seule journée
    },
    direction: {
        type: String,
        trim: true
    },
    notes: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['en_attente', 'acceptée', 'refusée'],
        default: 'en_attente'
    },
    respondedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    respondedAt: {
        type: Date
    },
    justification: {
        type: String,
        trim: true
    }
}, {
    timestamps: true // createdAt et updatedAt automatiques
});

module.exports = mongoose.model('VehicleRequest', vehicleRequestSchema);