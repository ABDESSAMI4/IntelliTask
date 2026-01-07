// backend/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: true,
        sparse: true
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
    },
    role: {
        type: String,
        enum: ['superAdmin', 'admin', 'user'],
        default: 'user',
    },
    specialty: {
        type: String,
        enum: ['pedagogique', 'orientation', 'planification', 'financiers', 'informatique', null], // ← Ajouté "informatique"
        default: null,
    },
    grade: {
        type: String,
        enum: ['A', 'B', 'C', null],
        default: null,
    },
    diplomas: [{ type: String }],
    formations: [{ type: String }],
    active: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});

userSchema.pre('save', async function() {
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);