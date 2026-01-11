const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
    taskId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
        required: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'refused', 'delegated'],
        default: 'pending',
    },
    justification: {
        type: String,
        default: '',
    },
    comment: {
        type: String,
        default: '',
    },
    respondedAt: {
        type: Date,
    },
}, {
    timestamps: true,
});

// Index pour accélérer les recherches par tâche et utilisateur
assignmentSchema.index({ taskId: 1, userId: 1 });

module.exports = mongoose.model('Assignment', assignmentSchema);