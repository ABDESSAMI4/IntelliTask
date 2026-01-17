// src/pages/TaskList.jsx - Avec Chat par tâche sous chaque carte
import { useEffect, useState } from 'react';
import API from '../services/api';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
//import ChatBox from '../components/ChatBox'; // ← Le chat par tâche

const TaskList = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await API.get('/tasks');
        setTasks(res.data);
        setLoading(false);
      } catch (err) {
        toast.error('Impossible de charger les tâches');
        setLoading(false);
      }
    };
    fetchTasks();
  }, []);

  const handleAssign = async (taskId, type) => {
    try {
      const res = await API.post(`/assignments/${type}/${taskId}`);

      toast.success(
        `Assignation ${type === 'manual' ? 'manuelle' : type === 'semi-auto' ? 'semi-automatique' : 'automatique IA'} lancée !`
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
                <div className="card-header bg-gradient bg-primary text-white">
                  <h5 className="mb-0">{task.name}</h5>
                </div>
                <div className="card-body">
                  <div className="row">
                    {/* Infos tâche à gauche */}
                    <div className="col-lg-5">
                      <p className="card-text">{task.description}</p>
                      <hr />
                      <div className="text-muted small">
                        <p className="mb-1"><strong>Places :</strong> {task.assignedTo.length} / {task.places}</p>
                        <p className="mb-1"><strong>Dates :</strong> {new Date(task.startDate).toLocaleDateString()} → {new Date(task.endDate).toLocaleDateString()}</p>
                        <p className="mb-1"><strong>Rémunérée :</strong> {task.remunerated ? `Oui (${task.remunerationAmount} DH)` : 'Non'}</p>
                        <p className="mb-1"><strong>Spécialités :</strong> {task.specialties?.join(', ') || 'Aucune'}</p>
                      </div>

                      {/* BOUTON PDF CORRIGÉ – SIMPLE ET PUBLIC */}
                    {/* AFFICHAGE PDF - UTILISE pdfUrl OU adminFile */}
{(task.adminFile || task.pdfUrl) && (
  <div className="mt-3">
    <a 
      href={task.pdfUrl || task.adminFile}  // ← priorise pdfUrl si existe, sinon adminFile
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
                            disabled={task.assignedTo.length >= task.places}
                          >
                            Manuel
                          </button>
                          <button
                            onClick={() => handleAssign(task._id, 'semi-auto')}
                            className="btn btn-outline-info"
                            disabled={task.assignedTo.length >= task.places}
                          >
                            Semi-Auto
                          </button>
                          <button
                            onClick={() => handleAssign(task._id, 'auto')}
                            className="btn btn-outline-warning"
                            disabled={task.assignedTo.length >= task.places}
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
    </div>
  );
};

export default TaskList;