const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    sendMessage,
    getGlobalMessages,
    getTaskMessages
} = require('../controllers/messageController');

// Envoyer un message (global ou par tâche)
router.post('/', protect, sendMessage);

// Chat global
router.get('/global', protect, getGlobalMessages);

// Chat par tâche
router.get('/task/:taskId', protect, getTaskMessages);

module.exports = router;