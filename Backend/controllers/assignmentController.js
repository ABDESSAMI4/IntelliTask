// backend/controllers/assignmentController.js

const Assignment = require('../models/Assignment');
const Task = require('../models/Task');
const User = require('../models/User');
const sendNotification = require('../utils/notification');

let openai = null;
if (process.env.OPENAI_API_KEY) {
    const { OpenAI } = require('openai');
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// Vérifie les chevauchements de dates pour un utilisateur
const hasOverlap = async(userId, taskStart, taskEnd) => {
    if (!taskStart || !taskEnd) return false;

    const overlapping = await Task.find({
        'assignedTo.user': userId,
        'assignedTo.status': 'accepted',
        $or: [{
            startDate: { $lt: taskEnd },
            endDate: { $gt: taskStart }
        }]
    });

    return overlapping.length > 0;
};

// Crée une assignation en attente (pending) avec notification, socket et auto-accept 24h
const createPendingAssignment = async(task, user, reason = '', req = null) => {
        const assignment = await Assignment.create({
            taskId: task._id,
            userId: user._id,
            status: 'pending',
            justification: reason
        });

        // Ajouter l'utilisateur à la liste des assignés dans la tâche
        task.assignedTo.push({ user: user._id, status: 'pending' });
        await task.save();

        const message = `Vous avez été proposé pour la tâche "${task.name}".\nRépondez dans les 24 heures !${reason ? `\n\nRaison : ${reason}` : ''}`;

  await sendNotification(user, message, 'all');

  // Émission en temps réel via Socket.io si disponible
  if (req && req.app && req.app.get('io')) {
    const io = req.app.get('io');
    io.to(`user_${user._id}`).emit('newAssignment', {
      assignmentId: assignment._id,
      taskId: task._id,
      taskName: task.name,
      message,
      createdAt: new Date()
    });
  }

  // Auto-accept après 24h si pas de réponse
  setTimeout(async () => {
    try {
      const currentAssignment = await Assignment.findById(assignment._id);
      if (!currentAssignment || currentAssignment.status !== 'pending') return;

      currentAssignment.status = 'accepted';
      currentAssignment.respondedAt = new Date();
      currentAssignment.justification = '(Auto-accepté après 24h sans réponse)';
      await currentAssignment.save();

      // Mise à jour du statut dans la tâche
      const updatedTask = await Task.findById(task._id);
      const assignedEntry = updatedTask.assignedTo.find(a => a.user.toString() === user._id.toString());
      if (assignedEntry) assignedEntry.status = 'accepted';

      await updatedTask.save();

      await sendNotification(
        user,
        `Votre proposition pour la tâche "${task.name}" a été automatiquement acceptée (aucune réponse dans les 24h).`,
        'all'
      );

      const admin = await User.findById(task.createdBy);
      if (admin) {
        await sendNotification(
          admin,
          `Auto-acceptation : ${user.name} a été confirmé pour la tâche "${task.name}".`,
          'all'
        );
      }
    } catch (err) {
      console.error('Erreur dans le timer auto-accept :', err);
    }
  }, 24 * 60 * 60 * 1000); // 24 heures

  return assignment;
};

// Mock IA simple (tour de rôle + équité rémunérée)
const mockAIAssignment = (task, candidates) => {
  const shuffled = [...candidates];
  shuffled.sort((a, b) => a.createdAt - b.createdAt);

  const selected = shuffled.slice(0, task.places);
  const report = `Mock IA : Sélection des ${selected.length} utilisateurs les plus anciens (tour de rôle simple).`;

  return {
    selectedUserIds: selected.map(u => u._id.toString()),
    report
  };
};

// 1. Assignation manuelle
exports.manualAssignment = async (req, res) => {
  try {
    const { taskId, userIds } = req.body;

    if (!taskId || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: 'taskId et userIds (tableau) sont requis' });
    }

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: 'Tâche non trouvée' });

    const validUsers = await User.find({ _id: { $in: userIds }, active: true });
    const assignments = [];

    for (const user of validUsers) {
      const overlap = await hasOverlap(user._id, task.startDate, task.endDate);
      if (overlap) {
        continue; // Ignorer si conflit de planning
      }

      const assignment = await createPendingAssignment(task, user, 'Assignation manuelle par administrateur', req);
      assignments.push({
        user: user.name,
        email: user.email,
        assignmentId: assignment._id
      });
    }

    res.json({
      message: 'Assignations manuelles envoyées avec succès',
      count: assignments.length,
      assignments,
      skipped: userIds.length - assignments.length > 0
        ? `${userIds.length - assignments.length} utilisateur(s) ignoré(s) (inactif ou conflit de dates)`
        : null
    });
  } catch (error) {
    console.error('Erreur assignation manuelle :', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// 2. Assignation semi-automatique (équité + ancienneté)
exports.semiAutoAssignment = async (req, res) => {
  try {
    const { taskId } = req.params;
    const task = await Task.findById(taskId).populate('createdBy');
    if (!task) return res.status(404).json({ message: 'Tâche non trouvée' });

    const assignedCount = task.assignedTo.filter(a => a.status === 'accepted').length;
    const neededPlaces = task.places - assignedCount;
    if (neededPlaces <= 0) {
      return res.status(400).json({ message: 'Toutes les places sont déjà pourvues' });
    }

    // Filtres de compatibilité
    const filters = { active: true, role: 'user' };
    if (task.specialties?.length > 0) filters.specialty = { $in: task.specialties };
    if (task.grades?.length > 0) filters.grade = { $in: task.grades };

    let candidates = await User.find(filters);

    // Si tâche rémunérée → prioriser ceux qui en ont fait le moins
    if (task.remunerated) {
      const remuneratedTaskIds = await Task.find({ remunerated: true }).distinct('_id');
      const acceptedCounts = await Assignment.aggregate([
        { $match: { taskId: { $in: remuneratedTaskIds }, status: 'accepted' } },
        { $group: { _id: '$userId', count: { $sum: 1 } } }
      ]);

      const countMap = {};
      acceptedCounts.forEach(c => (countMap[c._id] = c.count));

      candidates.sort((a, b) => {
        const countA = countMap[a._id?.toString()] || 0;
        const countB = countMap[b._id?.toString()] || 0;
        return countA - countB || a.createdAt - b.createdAt;
      });
    } else {
      candidates.sort((a, b) => a.createdAt - b.createdAt);
    }

    const selectedUsers = [];
    const reports = [];

    for (const user of candidates) {
      if (selectedUsers.length >= neededPlaces) break;

      const overlap = await hasOverlap(user._id, task.startDate, task.endDate);
      if (overlap) continue;

      let reason = 'Sélection semi-automatique : ';
      if (task.remunerated) {
        const count = (await Assignment.countDocuments({ userId: user._id, status: 'accepted', taskId: { $in: await Task.find({ remunerated: true }).distinct('_id') } })) || 0;
        reason += `équité rémunérée (${count} tâche(s) rémunérée(s) déjà faite(s)), `;
      }
      reason += 'ancienneté + aucune interférence de planning';

      selectedUsers.push(user);
      reports.push(`- ${user.name} (${user.email}) : ${reason}`);

      await createPendingAssignment(task, user, reason, req);
    }

    if (selectedUsers.length === 0) {
      return res.status(400).json({ message: 'Aucun candidat éligible trouvé (conflits de dates ou filtres trop restrictifs)' });
    }

    const fullReport = `Assignation semi-automatique\n\nTâche : "${task.name}"\nPlaces nécessaires : ${neededPlaces}\n\nPropositions envoyées :\n${reports.join('\n')}\n\nAuto-accept dans 24h si silence.`;

    await sendNotification(task.createdBy, fullReport, 'all');

    res.json({
      message: 'Assignation semi-automatique réussie',
      selectedCount: selectedUsers.length,
      selectedUsers: selectedUsers.map(u => ({ _id: u._id, name: u.name, email: u.email })),
      report: fullReport
    });
  } catch (error) {
    console.error('Erreur semi-auto assignment :', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// 3. Assignation automatique avec IA (ou fallback mock)
exports.autoAssignment = async (req, res) => {
  try {
    const { taskId } = req.params;
    const task = await Task.findById(taskId).populate('createdBy');
    if (!task) return res.status(404).json({ message: 'Tâche non trouvée' });

    const assignedCount = task.assignedTo.filter(a => a.status === 'accepted').length;
    const neededPlaces = task.places - assignedCount;
    if (neededPlaces <= 0) return res.status(400).json({ message: 'Toutes les places sont déjà pourvues' });

    const filters = { active: true, role: 'user' };
    if (task.specialties?.length > 0) filters.specialty = { $in: task.specialties };
    if (task.grades?.length > 0) filters.grade = { $in: task.grades };

    const candidates = await User.find(filters);
    if (candidates.length === 0) return res.status(400).json({ message: 'Aucun candidat compatible trouvé' });

    let aiResponse;

    if (openai) {
      try {
        const candidatesProfiles = await Promise.all(
          candidates.map(async (u) => {
            const history = await Assignment.find({ userId: u._id, status: 'accepted' })
              .populate('taskId', 'name direction specialties startDate endDate');
            const historyText = history.length > 0
              ? history.map(h => `• ${h.taskId.name} (${h.taskId.direction || 'N/A'}) - ${new Date(h.taskId.startDate).toLocaleDateString()} - Spéc: ${h.taskId.specialties?.join(', ')}`)
                .join('\n')
              : 'Aucun historique';

            return `Candidat: ${u.name}\nGrade: ${u.grade || 'N/A'}\nSpécialité: ${u.specialty || 'N/A'}\nDiplômes: ${u.diplomas?.join(', ') || 'N/A'}\nHistorique récent:\n${historyText}`;
          })
        );

        const prompt = `Tu es un système intelligent d'assignation équitable pour des auditeurs.\n\nTâche à pourvoir :\n- Nom: "${task.name}"\n- Description: ${task.description}\n- Direction: ${task.direction || 'N/A'}\n- Spécialités requises: ${task.specialties?.join(', ') || 'Aucune'}\n- Grades requis: ${task.grades?.join(', ') || 'Aucun'}\n- Dates: ${task.startDate ? new Date(task.startDate).toLocaleDateString() : 'N/A'} → ${task.endDate ? new Date(task.endDate).toLocaleDateString() : 'N/A'}\n\nCandidats:\n${candidatesProfiles.join('\n\n')}\n\nChoisis EXACTEMENT ${neededPlaces} candidat(s) en priorisant :\n1. Compatibilité grade/spécialité/diplôme\n2. Diversité géographique et thématique\n3. Équité globale (pas toujours les mêmes)\n4. Pas de chevauchement de planning\n\nRéponds UNIQUEMENT avec un JSON valide :\n{\n  "selectedUserIds": ["64a1b2c3d4e5f6...", ...],\n  "report": "Explication claire et détaillée de chaque choix"\n}`;

        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
          temperature: 0.7
        });

        aiResponse = JSON.parse(completion.choices[0].message.content);
      } catch (aiError) {
        console.warn('OpenAI a échoué, utilisation du mock IA :', aiError.message);
        aiResponse = mockAIAssignment(task, candidates);
      }
    } else {
      console.info('Clé OpenAI non configurée → utilisation du mock IA');
      aiResponse = mockAIAssignment(task, candidates);
    }

    const { selectedUserIds, report } = aiResponse;

    const assignments = [];
    let validCount = 0;

    for (const userId of selectedUserIds) {
      if (validCount >= neededPlaces) break;
      const user = candidates.find(u => u._id.toString() === userId);
      if (!user) continue;

      const overlap = await hasOverlap(user._id, task.startDate, task.endDate);
      if (overlap) continue;

      await createPendingAssignment(task, user, `Proposition IA :\n${report}`, req);
      assignments.push({ name: user.name, email: user.email });
      validCount++;
    }

    const fullReport = `Assignation Automatique par IA\n\nTâche : "${task.name}"\nPlaces nécessaires : ${neededPlaces}\nPropositions envoyées : ${validCount}\n\nRapport IA :\n${report}\n\nAuto-accept dans 24h.`;

    await sendNotification(task.createdBy, fullReport, 'all');

    res.json({
      message: 'Assignation IA terminée',
      selectedCount: validCount,
      report: fullReport
    });
  } catch (error) {
    console.error('Erreur assignation IA :', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// 4. Répondre à une proposition d'assignation
exports.respondToAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { status, justification = '', comment = '', delegatedTo } = req.body;

    if (!['accepted', 'refused', 'delegated'].includes(status)) {
      return res.status(400).json({ message: 'Statut invalide (accepted/refused/delegated)' });
    }

    if (status === 'refused' && !justification.trim()) {
      return res.status(400).json({ message: 'Justification obligatoire pour un refus' });
    }

    const assignment = await Assignment.findById(assignmentId)
      .populate('taskId')
      .populate('userId');

    if (!assignment) return res.status(404).json({ message: 'Assignation non trouvée' });

    if (assignment.userId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Vous ne pouvez répondre qu’à vos propres assignations' });
    }

    if (assignment.status !== 'pending') {
      return res.status(400).json({ message: 'Cette assignation a déjà été traitée' });
    }

    assignment.status = status;
    assignment.justification = justification.trim();
    assignment.comment = comment.trim();
    assignment.respondedAt = new Date();
    await assignment.save();

    // Mise à jour du statut dans la tâche
    const task = assignment.taskId;
    const assignedEntry = task.assignedTo.find(a => a.user.toString() === req.user._id.toString());
    if (assignedEntry) assignedEntry.status = status;

    await task.save();

    const admin = await User.findById(task.createdBy);
    let adminMessage = `${req.user.name} a ${status === 'accepted' ? 'accepté' : status === 'refused' ? 'refusé' : 'délégué'} la tâche "${task.name}".`;

    if (status === 'refused' && justification) {
      adminMessage += `\nJustification : ${justification}`;
    }

    if (admin) await sendNotification(admin, adminMessage, 'all');

    // Cas délégation
    if (status === 'delegated' && delegatedTo) {
      const newUser = await User.findById(delegatedTo);
      if (!newUser || !newUser.active) {
        return res.status(400).json({ message: 'Utilisateur délégué invalide ou inactif' });
      }

      await createPendingAssignment(task, newUser, `Délégué par ${req.user.name}${comment ? ' - ' + comment : ''}`, req);

      await sendNotification(admin, `${req.user.name} a délégué la tâche "${task.name}" à ${newUser.name}.`, 'all');
    }

    res.json({
      message: `Proposition ${status === 'accepted' ? 'acceptée' : status === 'refused' ? 'refusée' : 'déléguée'} avec succès`,
      assignment
    });
  } catch (error) {
    console.error('Erreur réponse assignation :', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

module.exports = {
  manualAssignment: exports.manualAssignment,
  semiAutoAssignment: exports.semiAutoAssignment,
  autoAssignment: exports.autoAssignment,
  respondToAssignment: exports.respondToAssignment
};