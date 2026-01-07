// backend/utils/notification.js
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const sendNotification = async(user, message, type = 'all') => {
    try {
        // === Envoi Email via Resend ===
        if (type === 'email' || type === 'all') {
            const { data, error } = await resend.emails.send({
                from: 'onboarding@resend.dev', // Expéditeur par défaut pour test (autorisé sans vérification)
                to: [user.email],
                subject: '📩 Notification TaskMe',
                text: message,
            });

            if (error) {
                console.error('❌ Erreur Resend :', error);
                return;
            }

            console.log(`✅ Email envoyé avec succès à ${user.email} (ID: ${data.id})`);
        }

        // === Notification Socket.io (real-time) ===
        if (type === 'socket' || type === 'all') {
            global.io.emit('notification', {
                userId: user._id,
                message: message,
            });
            console.log(`🔔 Notification Socket.io envoyée`);
        }
    } catch (error) {
        console.error('❌ Erreur inattendue notification :', error.message);
    }
};

module.exports = sendNotification;