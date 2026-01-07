// src/pages/HistoryUser.jsx
import { useEffect, useState } from 'react';
import API from '../services/api';
import { toast } from 'react-toastify';

const HistoryUser = () => {
  const [taskHistory, setTaskHistory] = useState([]);
  const [vehicleHistory, setVehicleHistory] = useState([]); // Nouveau pour véhicules
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('tasks'); // Tabs : tasks ou vehicles

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        // Historique tâches
        const taskRes = await API.get('/history/my');
        setTaskHistory(taskRes.data || []);

        // Historique véhicules
        const vehicleRes = await API.get('/history/vehicles/my');
        setVehicleHistory(vehicleRes.data || []);
      } catch (err) {
        toast.error('Impossible de charger votre historique');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (loading) return <div className="text-center py-5">Chargement...</div>;

  return (
    <div className="container py-5">
      <h2 className="text-primary fw-bold text-center mb-5">📜 Mon Historique</h2>

      {/* Tabs pour tâches / véhicules */}
      <ul className="nav nav-tabs nav-fill mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${tab === 'tasks' ? 'active' : ''}`}
            onClick={() => setTab('tasks')}
          >
            Tâches
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${tab === 'vehicles' ? 'active' : ''}`}
            onClick={() => setTab('vehicles')}
          >
            Véhicules
          </button>
        </li>
      </ul>

      {tab === 'tasks' ? (
        // Contenu tâches (comme avant)
        taskHistory.length === 0 ? (
          <div className="alert alert-info text-center py-5">
            <p className="mb-0 fs-4">Aucune tâche dans votre historique pour le moment.</p>
          </div>
        ) : (
          <div className="row g-4">
            {taskHistory.map((item) => (
              <div key={item._id} className="col-12">
                <div className="card shadow-sm border-0">
                  <div className="card-header d-flex justify-content-between align-items-center bg-primary text-white">
                    <h5 className="mb-0">{item.taskId?.name || 'Tâche supprimée'}</h5>
                    <span className={`badge fs-6 ${
                      item.status === 'accepted' ? 'bg-success' :
                      item.status === 'refused' ? 'bg-danger' :
                      item.status === 'delegated' ? 'bg-warning' : 'bg-secondary'
                    }`}>
                      {item.status === 'accepted' ? 'Acceptée' :
                       item.status === 'refused' ? 'Refusée' :
                       item.status === 'delegated' ? 'Déléguée' : item.status}
                    </span>
                  </div>
                  <div className="card-body">
                    <p className="text-muted">{item.taskId?.description || 'Pas de description'}</p>
                    <div className="row small text-muted">
                      <div className="col-6">
                        <strong>Début :</strong> {item.taskId?.startDate ? new Date(item.taskId.startDate).toLocaleDateString('fr-FR') : '-'}
                      </div>
                      <div className="col-6">
                        <strong>Fin :</strong> {item.taskId?.endDate ? new Date(item.taskId.endDate).toLocaleDateString('fr-FR') : '-'}
                      </div>
                    </div>

                    {item.justification && (
                      <div className="mt-3 p-3 bg-light rounded">
                        <strong>Motif :</strong> {item.justification}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        // Nouveau contenu pour véhicules
        vehicleHistory.length === 0 ? (
          <div className="alert alert-info text-center py-5">
            <p className="mb-0 fs-4">Aucun élément dans votre historique véhicules pour le moment.</p>
          </div>
        ) : (
          <div className="row g-4">
            {vehicleHistory.map((item) => (
              <div key={item._id} className="col-12">
                <div className="card shadow-sm border-0">
                  <div className="card-header d-flex justify-content-between align-items-center bg-info text-white">
                    <h5 className="mb-0">
                      {item.type === 'request' ? 'Demande Véhicule' : 'Attribution Véhicule'} - {item.vehicle?.matricule || 'Véhicule supprimé'}
                    </h5>
                    <span className={`badge fs-6 ${
                      item.status === 'accepted' ? 'bg-success' :
                      item.status === 'refused' ? 'bg-danger' :
                      item.status === 'returned' ? 'bg-primary' : 'bg-warning'
                    }`}>
                      {item.status === 'accepted' ? 'Acceptée' :
                       item.status === 'refused' ? 'Refusée' :
                       item.status === 'returned' ? 'Retourné' : item.status}
                    </span>
                  </div>
                  <div className="card-body">
                    <p className="text-muted">
                      {item.type === 'request' ? 'Demande pour' : 'Attribué pour'} : {item.vehicle?.marque} {item.vehicle?.modele}
                    </p>
                    <div className="row small text-muted">
                      <div className="col-6">
                        <strong>Début :</strong> {item.dateDebut ? new Date(item.dateDebut).toLocaleDateString('fr-FR') : '-'}
                      </div>
                      <div className="col-6">
                        <strong>Fin :</strong> {item.dateFin ? new Date(item.dateFin).toLocaleDateString('fr-FR') : '-'}
                      </div>
                    </div>

                    {item.justification && (
                      <div className="mt-3 p-3 bg-light rounded">
                        <strong>Motif :</strong> {item.justification}
                      </div>
                    )}

                    {item.notes && (
                      <p className="mt-3"><strong>Notes :</strong> {item.notes}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
};

export default HistoryUser;