// src/pages/DashboardUser.jsx - Utilise le bouton chat existant (pas de nouveau bouton)
import { useEffect, useState, useContext } from 'react';
import { toast } from 'react-toastify';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';

const DashboardUser = () => {
  const { user } = useContext(AuthContext);
  const [pendingTasks, setPendingTasks] = useState([]);
  const [myVehicles, setMyVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMyTasks = async () => {
    try {
      const res = await API.get('/assignments/my-pending');
      setPendingTasks(res.data);
    } catch (err) {
      toast.error('Impossible de charger vos tâches');
    }
  };

  const fetchMyVehicles = async () => {
    try {
      const res = await API.get('/vehicle-assignments/my-vehicles');
      setMyVehicles(res.data);
    } catch (err) {
      console.log('Aucun véhicule attribué ou erreur');
      setMyVehicles([]);
    }
  };

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([fetchMyTasks(), fetchMyVehicles()]);
      setLoading(false);
    };
    loadAll();
  }, []);

  const handleResponse = async (assignmentId, status, justification = '', delegatedTo = null) => {
    try {
      const payload = { status };
      if (status === 'refused') payload.justification = justification || 'Pas de justification';
      if (status === 'delegated') payload.delegatedTo = delegatedTo;

      await API.patch(`/assignments/response/${assignmentId}`, payload);
      
      toast.success(
        status === 'accepted' ? 'Tâche acceptée ! 🎉' :
        status === 'refused' ? 'Tâche refusée.' :
        'Tâche déléguée avec succès !'
      );

      fetchMyTasks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la réponse');
    }
  };

  const handleRefuse = (assignmentId) => {
    const justification = prompt('Justification obligatoire pour le refus :');
    if (justification && justification.trim()) {
      handleResponse(assignmentId, 'refused', justification.trim());
    } else if (justification !== null) {
      toast.warning('Justification obligatoire pour refuser');
    }
  };

  const handleDelegate = (assignmentId) => {
    const delegatedTo = prompt('ID de l\'utilisateur à qui déléguer :');
    if (delegatedTo && delegatedTo.trim()) {
      handleResponse(assignmentId, 'delegated', '', delegatedTo.trim());
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
        <p className="mt-3 fs-5">Chargement de vos tâches en attente...</p>
      </div>
    );
  }

  return (
    <div className="container-fluid py-5">
      <div className="row">
        {/* Colonne gauche : Tâches en attente */}
        <div className="col-lg-7 mb-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="text-primary fw-bold">Mes Tâches en Attente</h2>
            <div className="text-muted fs-5">
              Connecté : <strong>{user?.name || user?.email}</strong>
            </div>
          </div>

          {pendingTasks.length === 0 ? (
            <div className="alert alert-success text-center shadow-lg p-5">
              <h4 className="mb-3">🎉 Bravo ! Aucune tâche en attente</h4>
              <p className="fs-5">Profitez de votre temps libre ou discutez avec l'équipe dans le chat ! 😊</p>
            </div>
          ) : (
            <div className="row g-4">
              {pendingTasks.map((assignment) => {
                const task = assignment.taskId;
                return (
                  <div key={assignment._id} className="col-12">
                    <div className="card shadow-lg border-0 h-100">
                      <div className="card-header bg-gradient bg-primary text-white">
                        <h5 className="mb-0">{task.name}</h5>
                      </div>
                      <div className="card-body d-flex flex-column">
                        <p className="text-muted flex-grow-1">{task.description}</p>
                        
                        <div className="row text-muted small mb-3">
                          <div className="col-6">
                            <strong>Début :</strong> {new Date(task.startDate).toLocaleDateString()}
                          </div>
                          <div className="col-6">
                            <strong>Fin :</strong> {new Date(task.endDate).toLocaleDateString()}
                          </div>
                        </div>

                        {task.remunerated && (
                          <p className="text-success fw-bold">
                            Rémunérée : {task.remunerationAmount} DH 💰
                          </p>
                        )}

                        <div className="mt-auto">
                          <div className="btn-group w-100" role="group">
                            <button
                              onClick={() => handleResponse(assignment._id, 'accepted')}
                              className="btn btn-success btn-lg"
                            >
                              ✅ Accepter
                            </button>
                            <button
                              onClick={() => handleRefuse(assignment._id)}
                              className="btn btn-danger btn-lg"
                            >
                              ❌ Refuser
                            </button>
                            <button
                              onClick={() => handleDelegate(assignment._id)}
                              className="btn btn-warning btn-lg"
                            >
                              🔄 Déléguer
                            </button>
                          </div>
                        </div>

                        {assignment.justification && (
                          <small className="text-muted mt-3 text-end">
                            <em>Raison : {assignment.justification}</em>
                          </small>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Colonne droite : Mes Véhicules Attribués */}
        <div className="col-lg-5 mb-4">
          <h3 className="text-primary fw-bold mb-4">🚗 Mes Véhicules Attribués</h3>

          {myVehicles.length === 0 ? (
            <div className="alert alert-info text-center shadow p-4">
              <p className="mb-2 fw-bold">Aucun véhicule attribué pour le moment</p>
              <small className="text-muted">
                Il sera affiché ici dès qu’un administrateur vous attribuera un véhicule.
              </small>
            </div>
          ) : (
            <div className="row g-3">
              {myVehicles.map((assignment) => (
                <div key={assignment._id} className="col-12">
                  <div className="card shadow-sm border-0">
                    <div className="card-header bg-info text-white">
                      <h6 className="mb-0 fw-bold">
                        {assignment.vehicle.matricule} — {assignment.vehicle.marque} {assignment.vehicle.modele}
                      </h6>
                    </div>
                    <div className="card-body small">
                      <p className="mb-2">
                        <strong>Type :</strong>{' '}
                        {assignment.type === 'individuelle' ? '👤 Individuelle' : '👥 Covoiturage'}
                      </p>

                      {assignment.type === 'partagée' && (
                        <p className="mb-2">
                          <strong>Avec :</strong>{' '}
                          {assignment.users
                            .filter(u => u._id !== user._id)
                            .map(u => u.name)
                            .join(', ') || 'Aucun autre collègue'}
                        </p>
                      )}

                      <p className="mb-2">
                        <strong>Période :</strong>{' '}
                        {new Date(assignment.dateDebut).toLocaleDateString('fr-FR')}
                        {assignment.dateFin
                          ? ` → ${new Date(assignment.dateFin).toLocaleDateString('fr-FR')}`
                          : ' (en cours)'}
                      </p>

                      {assignment.direction && (
                        <p className="mb-2">
                          <strong>Direction :</strong> {assignment.direction}
                        </p>
                      )}

                      {assignment.notes && (
                        <p className="mb-0 text-muted">
                          <em>Notes : {assignment.notes}</em>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Le bouton chat flottant existant dans ton app (en bas à droite) 
          va maintenant ouvrir la Discussion générale.
          Tu n'as RIEN à ajouter ici : ton layout global (probablement dans App.jsx ou un component parent)
          contient déjà ce bouton et gère l'ouverture du chat général.
          Donc on ne touche à rien ! */}
    </div>
  );
};

export default DashboardUser;