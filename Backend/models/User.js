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
        default: null,
        // enum supprimé → accepte n'importe quelle chaîne (plus flexible)
    },
    grade: {
        type: String,
        default: null,
        // enum supprimé → accepte A, B, C ou autre
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