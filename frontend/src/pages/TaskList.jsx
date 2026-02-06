import { useEffect, useState } from 'react';
import API from '../services/api';
import { toast } from 'react-toastify';
import { Link, useNavigate } from 'react-router-dom';

const TaskList = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [auditors, setAuditors] = useState([]); // ← Liste des auditeurs
  const navigate = useNavigate();

  // Modal pour affectation manuelle
  const [manualModal, setManualModal] = useState({
    open: false,
    taskId: null,
    selectedAuditors: [], // tableau des IDs sélectionnés
  });

  // Charger les tâches + les auditeurs
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Tâches
        const tasksRes = await API.get('/tasks');
        setTasks(tasksRes.data);

        // Liste des auditeurs (utilisateurs role "user")
        const usersRes = await API.get('/users');
        const auditorsList = usersRes.data.filter(u => u.role === 'user');
        setAuditors(auditorsList);

        setLoading(false);
      } catch (err) {
        toast.error('Impossible de charger les données');
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAssign = async (taskId, type) => {
    if (type === 'manual') {
      setManualModal({
        open: true,
        taskId,
        selectedAuditors: [],
      });
      return;
    }

    // semi-auto et auto
    try {
      const res = await API.post(`/assignments/${type}/${taskId}`);

      toast.success(
        `Assignation ${type === 'semi-auto' ? 'semi-automatique' : 'automatique IA'} lancée !`
      );

      if (res.data.report) {
        toast.info(res.data.report, {
          autoClose: false,
          style: { whiteSpace: 'pre-line' }
        });
      }

      const tasksRes = await API.get('/tasks');
      setTasks(tasksRes.data);
    } catch (err) {
      const msg = err.response?.data?.message || 'Erreur lors de l\'assignation';
      toast.error(msg);
    }
  };

  const confirmManualAssignment = async () => {
    if (manualModal.selectedAuditors.length === 0) {
      toast.error('Veuillez sélectionner au moins un auditeur');
      return;
    }

    try {
      await API.post('/assignments/manual', {
        taskId: manualModal.taskId,
        userIds: manualModal.selectedAuditors,
      });

      toast.success('Affectation manuelle effectuée avec succès !');

      // Rafraîchir les tâches
      const tasksRes = await API.get('/tasks');
      setTasks(tasksRes.data);

      // Fermer modal
      setManualModal({ open: false, taskId: null, selectedAuditors: [] });
    } catch (err) {
      const msg = err.response?.data?.message || 'Erreur lors de l\'affectation';
      toast.error(msg);
    }
  };

  const toggleAuditorSelection = (auditorId) => {
    setManualModal(prev => {
      const alreadySelected = prev.selectedAuditors.includes(auditorId);
      if (alreadySelected) {
        return {
          ...prev,
          selectedAuditors: prev.selectedAuditors.filter(id => id !== auditorId),
        };
      } else {
        return {
          ...prev,
          selectedAuditors: [...prev.selectedAuditors, auditorId],
        };
      }
    });
  };

  const handleEditTask = (taskId) => {
    navigate(`/admin/tasks/edit/${taskId}`);
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('⚠️ Voulez-vous vraiment supprimer cette tâche ?')) return;

    try {
      await API.delete(`/tasks/${taskId}`);
      toast.success('✅ Tâche supprimée avec succès');
      setTasks(prev => prev.filter(t => t._id !== taskId));
    } catch (err) {
      toast.error('❌ Erreur lors de la suppression');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
        <p className="mt-3">Chargement des tâches...</p>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="d-flex justify-content-between align-items-center mb-5">
        <h2 className="text-primary fw-bold">Liste des Tâches</h2>
        <Link to="/admin/tasks/create" className="btn btn-success btn-lg px-5">
          + Créer une tâche
        </Link>
      </div>

      {tasks.length === 0 ? (
        <div className="alert alert-info text-center shadow">
          <h4>Aucune tâche pour le moment</h4>
          <p>Commencez par créer une nouvelle tâche !</p>
        </div>
      ) : (
        <div className="row g-4">
          {tasks.map(task => (
            <div key={task._id} className="col-12">
              <div className="card shadow-lg border-0 mb-4">
                <div className="card-header bg-gradient bg-primary text-white d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">{task.name}</h5>
                  <div>
                    <button
                      className="btn btn-sm btn-warning me-2"
                      onClick={() => handleEditTask(task._id)}
                      title="Modifier cette tâche"
                    >
                      ✏️ Modifier
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDeleteTask(task._id)}
                      title="Supprimer cette tâche"
                    >
                      🗑 Supprimer
                    </button>
                  </div>
                </div>

                <div className="card-body">
                  <div className="row">
                    <div className="col-lg-5">
                      <p className="card-text">{task.description}</p>
                      <hr />
                      <div className="text-muted small">
                        <p className="mb-1">
                          <strong>Places :</strong> {task.assignedTo?.length || 0} / {task.places}
                        </p>
                        <p className="mb-1">
                          <strong>Dates :</strong>{' '}
                          {new Date(task.startDate).toLocaleDateString()} →{' '}
                          {new Date(task.endDate).toLocaleDateString()}
                        </p>
                        <p className="mb-1">
                          <strong>Rémunérée :</strong>{' '}
                          {task.remunerated ? `Oui (${task.remunerationAmount} DH)` : 'Non'}
                        </p>
                        <p className="mb-1">
                          <strong>Spécialités :</strong>{' '}
                          {task.specialties?.join(', ') || 'Aucune'}
                        </p>
                      </div>

                      {(task.adminFile || task.pdfUrl) && (
                        <div className="mt-3">
                          <a
                            href={task.pdfUrl || task.adminFile}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-info"
                          >
                            📄 Voir PDF joint
                          </a>
                        </div>
                      )}

                      <div className="mt-4">
                        <div className="btn-group w-100" role="group">
                          <button
                            onClick={() => handleAssign(task._id, 'manual')}
                            className="btn btn-outline-primary"
                            disabled={task.assignedTo?.length >= task.places}
                          >
                            Manuel
                          </button>
                          <button
                            onClick={() => handleAssign(task._id, 'semi-auto')}
                            className="btn btn-outline-info"
                            disabled={task.assignedTo?.length >= task.places}
                          >
                            Semi-Auto
                          </button>
                          <button
                            onClick={() => handleAssign(task._id, 'auto')}
                            className="btn btn-outline-warning"
                            disabled={task.assignedTo?.length >= task.places}
                          >
                            Auto IA
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal choix des auditeurs */}
      {manualModal.open && (
        <div
          className="modal fade show"
          style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}
          tabIndex="-1"
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Affectation manuelle</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setManualModal({ open: false, taskId: null, selectedAuditors: [] })}
                ></button>
              </div>

              <div className="modal-body">
                <p className="mb-3">
                  Sélectionnez les auditeurs à assigner à cette tâche :
                </p>

                {auditors.length === 0 ? (
                  <div className="alert alert-warning">
                    Aucun auditeur disponible pour le moment
                  </div>
                ) : (
                  <div className="list-group" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                    {auditors.map(auditor => (
                      <button
                        key={auditor._id}
                        type="button"
                        className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${
                          manualModal.selectedAuditors.includes(auditor._id) ? 'active' : ''
                        }`}
                        onClick={() => toggleAuditorSelection(auditor._id)}
                      >
                        <div>
                          <strong>{auditor.name}</strong>
                          <small className="d-block text-muted">{auditor.email}</small>
                        </div>
                        {manualModal.selectedAuditors.includes(auditor._id) && (
                          <span className="badge bg-success">Sélectionné</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setManualModal({ open: false, taskId: null, selectedAuditors: [] })}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={confirmManualAssignment}
                  disabled={manualModal.selectedAuditors.length === 0}
                >
                  Assigner ({manualModal.selectedAuditors.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskList;