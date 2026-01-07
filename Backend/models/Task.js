// backend/models/Task.js
const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        // required: false → maintenant optionnel
    },
    description: {
        type: String,
        trim: true,
        // required: false → maintenant optionnel
    },
    type: {
        type: String,
        trim: true,
        // optionnel
    },
    startDate: {
        type: Date,
        // optionnel
    },
    endDate: {
        type: Date,
        required: true, // on garde obligatoire pour avoir au moins une date de référence
    },
    remunerated: {
        type: Boolean,
        default: false,
    },
    remunerationAmount: {
        type: Number,
        default: 0,
    },
    specialties: [{
        type: String
    }],
    isCommon: {
        type: Boolean,
        default: false,
    },
    grades: [{
        type: String
    }],
    needsVehicle: {
        type: Boolean,
        default: false,
    },
    direction: {
        type: String,
        trim: true,
    },
    adminFile: {
        type: String, // URL Cloudinary
    },
    places: {
        type: Number,
        default: 1,
        min: [1, 'Le nombre de places doit être au moins 1'],
    },
    status: {
        type: String,
        enum: ['ouverte', 'en cours', 'terminée', 'annulée'],
        default: 'ouverte'
    },
    assignedTo: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        status: { type: String, enum: ['pending', 'accepted', 'refused', 'delegated'], default: 'pending' },
        justification: String,
        respondedAt: Date
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true // gardé pour traçabilité
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Task', TaskSchema);