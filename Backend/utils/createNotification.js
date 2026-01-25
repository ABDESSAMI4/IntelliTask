const Notification = require('../models/Notification');
const sendNotification = require('./notification'); // Votre util pour Resend

let io;

exports.setSocketIo = (socketIoInstance) => {
    io = socketIoInstance;
};

async function createNotification({
    userId,
    title,
    message,
    type,
    relatedTaskId = null,
    relatedUserId = null,
    sendEmail = true // Optionnel, default true
}) {
    try {
        const notification = await Notification.create({
            user: userId,
            title,
            message,
            type,
            relatedTask: relatedTaskId,
            relatedUser: relatedUserId,
            sentViaEmail: sendEmail
        });

        // Socket.io real-time
        if (io) {
            io.to(`user_${userId}`).emit('newNotification', notification);
            console.log(`[NOTIF] Push real-time à user_${userId}`);
        }

        // Email si activé
        if (sendEmail) {
            const user = await require('../models/User').findById(userId);
            if (user) {
                await sendNotification(user, `${title}\n\n${message}`, 'email');
            }
        }

        return notification;
    } catch (error) {
        console.error('[NOTIF ERROR]', error.message);
        throw error;
    }
}

module.exports = createNotification;