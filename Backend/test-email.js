require('dotenv').config();
const sendNotification = require('./utils/notification');

// Utilise TON email @edu (celui avec lequel tu t'es inscrit sur Resend)
sendNotification({ _id: 'test', email: 'a.aglagal@edu.umi.ac.ma' },
    '🎉 Félicitations ! Test Resend 100% réussi ! Ton système de notification TaskMe fonctionne parfaitement maintenant avec une solution moderne et fiable. 🚀',
    'email'
).then(() => console.log('Test terminé – vérifie ta boîte @edu !'));