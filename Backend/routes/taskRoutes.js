const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
    createTask,
    getTasks,
    getTaskById,
    updateTask,
    deleteTask
} = require('../controllers/taskController');

// POST /api/tasks - Créer une tâche 
router.post('/', protect, admin('admin', 'superAdmin'), createTask);

// GET /api/tasks - Lister toutes les tâches 
router.get('/', protect, admin('admin', 'superAdmin'), getTasks);

// GET /api/tasks/:id - Détail d'une tâche
router.get('/:id', protect, getTaskById);

// PUT /api/tasks/:id - Modifier une tâche 
router.put('/:id', protect, admin('admin', 'superAdmin'), updateTask);

// DELETE /api/tasks/:id - Supprimer une tâche 
router.delete('/:id', protect, admin('admin', 'superAdmin'), deleteTask);

module.exports = router;