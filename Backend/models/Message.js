// backend/models/Message.js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    task: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
        default: null // null = chat global
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Message', messageSchema);