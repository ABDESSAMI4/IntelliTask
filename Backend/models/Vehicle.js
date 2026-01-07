const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
    matricule: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },
    marque: { type: String, required: true },
    modele: { type: String, required: true },
    annee: { type: Number, required: true },
    type: {
        type: String,
        enum: ['Voiture', 'Utilitaire', 'Moto', 'Camion'],
        default: 'Voiture'
    },
    carburant: {
        type: String,
        enum: ['Essence', 'Diesel', 'Électrique', 'Hybride'],
        default: 'Diesel'
    },
    notes: String,
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Vehicle', vehicleSchema);