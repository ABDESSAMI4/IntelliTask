// src/pages/HistoryGlobal.jsx
import { useEffect, useState } from 'react';
import API from '../services/api';
import { toast } from 'react-toastify';

const HistoryGlobal = () => {
  const [taskHistory, setTaskHistory] = useState([]);
  const [vehicleHistory, setVehicleHistory] = useState([]); // Nouveau pour véhicules
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('tasks'); // Tabs : tasks ou vehicles

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        // Historique tâches global
        const taskRes = await API.get('/history/global');
        setTaskHistory(taskRes.data || []);

        // Historique véhicules global
        const vehicleRes = await API.get('/history/vehicles/global');
        setVehicleHistory(vehicleRes.data || []);
      } catch (err) {
        toast.error('Erreur lors du chargement de l\'historique global');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (loading) return <div className="text-center py-5">Chargement...</div>;

  return (
    <div className="container py-5">
      <h2 className="text-primary fw-bold text-center mb-5">📜 Historique Global (Admin)</h2>

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
        // Contenu tâches global (comme avant)
        taskHistory.length === 0 ? (
          <div className="alert alert-info text-center py-5">
            <p className="mb-0 fs-4">Aucun élément dans l'historique global des tâches.</p>
          </div>
        ) : (
          <div className="table-responsive shadow rounded">
            <table className="table table-striped table-hover">
              <thead className="table-dark">
                <tr>
                  <th>Date</th>
                  <th>Tâche</th>
                  <th>Utilisateur</th>
                  <th>Statut</th>
                  <th>Motif</th>
                </tr>
              </thead>
              <tbody>
                {taskHistory.map((item) => (
                  <tr key={item._id}>
                    <td>{new Date(item.respondedAt || item.createdAt).toLocaleDateString('fr-FR')}</td>
                    <td>{item.taskId?.name || 'Supprimée'}</td>
                    <td>{item.userId?.name || 'Supprimé'}</td>
                    <td>
                      <span className={`badge ${
                        item.status === 'accepted' ? 'bg-success' :
                        item.status === 'refused' ? 'bg-danger' :
                        item.status === 'delegated' ? 'bg-warning' : 'bg-secondary'
                      }`}>
                        {item.status === 'accepted' ? 'Acceptée' :
                         item.status === 'refused' ? 'Refusée' :
                         item.status === 'delegated' ? 'Déléguée' : item.status}
                      </span>
                    </td>
                    <td>{item.justification || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        // Nouveau contenu pour véhicules global
        vehicleHistory.length === 0 ? (
          <div className="alert alert-info text-center py-5">
            <p className="mb-0 fs-4">Aucun élément dans l'historique global des véhicules.</p>
          </div>
        ) : (
          <div className="table-responsive shadow rounded">
            <table className="table table-striped table-hover">
              <thead className="table-dark">
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Véhicule</th>
                  <th>Utilisateur</th>
                  <th>Statut</th>
                  <th>Motif</th>
                </tr>
              </thead>
              <tbody>
                {vehicleHistory.map((item) => (
                  <tr key={item._id}>
                    <td>{new Date(item.respondedAt || item.createdAt).toLocaleDateString('fr-FR')}</td>
                    <td>{item.type === 'request' ? 'Demande' : 'Attribution'}</td>
                    <td>{item.vehicle?.matricule || 'Supprimé'} ({item.vehicle?.marque} {item.vehicle?.modele})</td>
                    <td>{item.user?.name || item.userId?.name || 'Supprimé'}</td>
                    <td>
                      <span className={`badge ${
                        item.status === 'accepted' ? 'bg-success' :
                        item.status === 'refused' ? 'bg-danger' :
                        item.status === 'returned' ? 'bg-primary' : 'bg-warning'
                      }`}>
                        {item.status === 'accepted' ? 'Acceptée' :
                         item.status === 'refused' ? 'Refusée' :
                         item.status === 'returned' ? 'Retourné' : item.status}
                      </span>
                    </td>
                    <td>{item.justification || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
};

export default HistoryGlobal;