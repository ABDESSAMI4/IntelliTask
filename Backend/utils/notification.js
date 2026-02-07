const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const sendNotification = async(user, message, type = 'all') => {
    try {
        // === Envoi Email via Resend ===
        if (type === 'email' || type === 'all') {
            if (!user || !user.email) {
                console.error('Impossible d\'envoyer email : aucun email pour l\'utilisateur');
                return;
            }

            console.log(`Envoi email à ${user.email} ...`);

            const { data, error } = await resend.emails.send({
                from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
                to: user.email, // ← C'EST ÇA QUI MANQUAIT !
                subject: '📩 Notification IntelliTask',
                text: message,
                // Optionnel : html si tu veux un bel email
                // html: `<p>${message.replace(/\n/g, '<br>')}</p>`,
            });

            if (error) {
                console.error('Erreur Resend :', error);
                return;
            }

            console.log(`Email envoyé avec succès à ${user.email} (ID: ${data.id})`);
        }

        // === Notification Socket.io (si tu l'as) ===
        if (type === 'socket' || type === 'all') {
            // ton code socket ici...
        }
    } catch (error) {
        console.error('❌ Erreur inattendue notification :', error.message);
    }
};

module.exports = sendNotification;