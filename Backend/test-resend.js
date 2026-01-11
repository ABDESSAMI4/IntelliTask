require('dotenv').config();
const sendNotification = require('./utils/notification');


sendNotification({
            _id: 'test-notification',
            email: 'a.aglagal@edu.umi.ac.ma',
            name: 'Abdessami'
        },
        '🎉 Félicitations ! Test Resend réussi !\n\nTon système de notification IntelliTask fonctionne maintenant parfaitement avec Resend.\n\nTu peux maintenant envoyer des emails automatiques pour :\n• Confirmation de compte\n• Demandes de véhicules acceptées/refusées\n• Nouvelles tâches assignées\n• Rappels\n\n🚀 Prochaine étape : le déploiement complet !',
        'email'
    )
    .then(() => {
        console.log('✅ Email envoyé avec succès ! Vérifie ta boîte de réception (et spam) sur a.aglagal@edu.umi.ac.ma');
    })
    .catch((err) => {
        console.error('❌ Erreur envoi email :', err);
        if (err.statusCode) {
            console.error(`Status: ${err.statusCode}`);
            console.error('Message:', err.message);
        }
    });