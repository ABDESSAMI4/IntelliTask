const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

const Notification = require('../models/Notification');

// Toutes les notifications de l'utilisateur connecté
router.get('/', protect, async(req, res) => {
    const notifications = await Notification.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .limit(50)
        .populate('relatedTask', 'name')
        .populate('relatedUser', 'name email');

    res.json(notifications);
});

// Marquer comme lu
router.patch('/:id/read', protect, async(req, res) => {
    const notif = await Notification.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, { isRead: true }, { new: true });
    if (!notif) return res.status(404).json({ message: 'Notification non trouvée' });
    res.json(notif);
});

// Compteur non lus
router.get('/unread-count', protect, async(req, res) => {
    const count = await Notification.countDocuments({
        user: req.user._id,
        isRead: false
    });
    res.json({ unreadCount: count });
});

module.exports = router;