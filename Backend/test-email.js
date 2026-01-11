require('dotenv').config();
const sendNotification = require('./utils/notification');


sendNotification({ _id: 'test', email: 'a.aglagal@edu.umi.ac.ma' },
    '🎉 Félicitations ! Test Resend 100% réussi ! Ton système de notification TaskMe fonctionne parfaitement maintenant avec une solution moderne et fiable. 🚀',
    'email'
).then(() => console.log('Test terminé – vérifie ta boîte @edu !'));