const Message = require('../models/Message');

// Envoyer un message
exports.sendMessage = async(req, res) => {
    try {
        const { content, taskId } = req.body;

        if (!content || content.trim() === '') {
            return res.status(400).json({ message: 'Message vide' });
        }

        const message = await Message.create({
            content: content.trim(),
            sender: req.user._id,
            task: taskId || null
        });

        const populatedMessage = await Message.findById(message._id)
            .populate('sender', 'name email role');

        // Realtime avec Socket.io
        const io = req.app.get('io');
        if (io) {
            io.emit('newMessage', {
                ...populatedMessage.toObject(),
                taskId: taskId || null
            });
        }

        res.status(201).json(populatedMessage);
    } catch (error) {
        console.error('Erreur envoi message :', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// Chat global
exports.getGlobalMessages = async(req, res) => {
    try {
        const messages = await Message.find({ task: null })
            .populate('sender', 'name email role')
            .sort({ createdAt: 1 })
            .limit(100);

        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: 'Erreur chargement' });
    }
};

// Chat par tâche
exports.getTaskMessages = async(req, res) => {
    try {
        const { taskId } = req.params;

        const messages = await Message.find({ task: taskId })
            .populate('sender', 'name email role')
            .sort({ createdAt: 1 })
            .limit(100);

        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: 'Erreur chargement' });
    }
};