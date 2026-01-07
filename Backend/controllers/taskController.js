// backend/controllers/taskController.js
const Task = require('../models/Task');
const cloudinary = require('cloudinary').v2;

// Upload base64 vers Cloudinary (pour PDF)
const uploadBase64ToCloudinary = async(base64String) => {
    if (!base64String || !base64String.startsWith('data:application/pdf;base64,')) {
        throw new Error('Format base64 invalide : doit commencer par data:application/pdf;base64,');
    }
    return await cloudinary.uploader.upload(base64String, {
        resource_type: 'raw',
        folder: 'tasks_admin_files',
        format: 'pdf'
    });
};

// CREATE TASK (POST)
exports.createTask = async(req, res) => {
    try {
        console.log('Body reçu :', req.body);
        console.log('Utilisateur connecté :', req.user);

        const {
            name,
            description,
            type,
            startDate,
            endDate,
            places,
            remunerated,
            remunerationAmount,
            specialties,
            grades,
            needsVehicle,
            direction,
            isCommon,
            adminFile
        } = req.body;

        const errors = [];

        if (!name || typeof name !== 'string' || name.trim() === '') {
            errors.push('Le nom de la tâche est obligatoire');
        }
        if (!description || typeof description !== 'string' || description.trim() === '') {
            errors.push('La description est obligatoire');
        }
        if (!type || typeof type !== 'string' || type.trim() === '') {
            errors.push('Le type de tâche est obligatoire');
        }
        if (!endDate) {
            errors.push('La date de fin est obligatoire');
        }
        if (!places || isNaN(places) || Number(places) < 1) {
            errors.push('Le nombre de places doit être un nombre entier ≥ 1');
        }

        if (errors.length > 0) {
            return res.status(400).json({ message: 'Données invalides', errors });
        }

        let adminFileUrl = null;
        if (adminFile) {
            if (typeof adminFile === 'string' && adminFile.startsWith('data:application/pdf;base64,')) {
                try {
                    const result = await uploadBase64ToCloudinary(adminFile);
                    adminFileUrl = result.secure_url;
                } catch (uploadErr) {
                    console.error('Erreur upload Cloudinary :', uploadErr);
                    return res.status(400).json({
                        message: 'Erreur lors de l’upload du PDF'
                    });
                }
            } else if (typeof adminFile === 'string' && adminFile.startsWith('http')) {
                adminFileUrl = adminFile;
            } else {
                return res.status(400).json({
                    message: 'adminFile doit être une chaîne base64 valide ou une URL'
                });
            }
        }

        const task = await Task.create({
            name: name.trim(),
            description: description.trim(),
            type: type.trim(),
            startDate: startDate ? startDate : null,
            endDate: endDate,
            places: Number(places),
            remunerated: remunerated === true,
            remunerationAmount: remunerationAmount ? Number(remunerationAmount) : 0,
            specialties: Array.isArray(specialties) ? specialties : [],
            grades: Array.isArray(grades) ? grades : [],
            needsVehicle: needsVehicle === true,
            direction: direction && typeof direction === 'string' ? direction.trim() : '',
            isCommon: isCommon === true,
            adminFile: adminFileUrl,
            createdBy: req.user._id,
            status: 'ouverte'
        });

        res.status(201).json({
            message: 'Tâche créée avec succès',
            task
        });

    } catch (error) {
        console.error('🔴 ERREUR CRÉATION TÂCHE :', error);

        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ message: 'Validation MongoDB échouée', errors });
        }

        res.status(500).json({
            message: 'Erreur serveur lors de la création de la tâche',
            detail: error.message
        });
    }
};

// GET ALL TASKS (GET /api/tasks)
exports.getTasks = async(req, res) => {
    try {
        const tasks = await Task.find()
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 }); // Plus récentes en premier

        res.json(tasks);
    } catch (error) {
        console.error('Erreur getTasks :', error);
        res.status(500).json({ message: 'Erreur serveur lors du chargement des tâches' });
    }
};

// GET TASK BY ID (optionnel)
exports.getTaskById = async(req, res) => {
    try {
        const task = await Task.findById(req.params.id)
            .populate('createdBy', 'name email');
        if (!task) return res.status(404).json({ message: 'Tâche non trouvée' });
        res.json(task);
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// UPDATE TASK (optionnel)
exports.updateTask = async(req, res) => {
    try {
        const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!task) return res.status(404).json({ message: 'Tâche non trouvée' });
        res.json({ message: 'Tâche mise à jour', task });
    } catch (error) {
        res.status(500).json({ message: 'Erreur mise à jour' });
    }
};

// DELETE TASK (optionnel)
exports.deleteTask = async(req, res) => {
    try {
        const task = await Task.findByIdAndDelete(req.params.id);
        if (!task) return res.status(404).json({ message: 'Tâche non trouvée' });
        res.json({ message: 'Tâche supprimée avec succès' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur suppression' });
    }
};