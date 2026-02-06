// src/pages/DashboardUser.jsx
import { useEffect, useState, useContext, useCallback } from 'react';
import { toast } from 'react-toastify';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { Modal, Button, Form, Spinner } from 'react-bootstrap';

const DashboardUser = () => {
  const { user } = useContext(AuthContext);
  const [pendingTasks, setPendingTasks] = useState([]);
  const [myVehicles, setMyVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  // États pour délégation
  const [showDelegateModal, setShowDelegateModal] = useState(false);
  const [currentAssignmentId, setCurrentAssignmentId] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [availableUsers, setAvailableUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);

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
      setMyVehicles([]);
    }
  };

  // Charger uniquement les auditeurs (role: user, active: true, hors soi-même)
  const fetchAvailableUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      // Nouvelle route recommandée (à ajouter dans userRoutes.js)
      const res = await API.get('/users/auditors');

      setAvailableUsers(res.data);
    } catch (err) {
      console.error('Erreur chargement auditeurs:', err);
      toast.error('Impossible de charger la liste des auditeurs pour la délégation');
      setAvailableUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([fetchMyTasks(), fetchMyVehicles()]);
      fetchAvailableUsers(); // Charger les auditeurs en parallèle
      setLoading(false);
    };
    loadAll();
  }, [fetchAvailableUsers]);

  const handleResponse = async (assignmentId, status, justification = '', delegatedTo = null) => {
    try {
      const payload = { status };
      if (status === 'refused') payload.justification = justification || 'Pas de justification';
      if (status === 'delegated') {
        payload.delegatedTo = delegatedTo;
        const selectedUser = availableUsers.find(u => u._id === delegatedTo);
        payload.comment = `Délégation à ${selectedUser?.name || 'un auditeur'}`;
      }

      await API.patch(`/assignments/response/${assignmentId}`, payload);

      let message = '';
      switch (status) {
        case 'accepted':
          message = '✅ Tâche acceptée avec succès !';
          break;
        case 'refused':
          message = '❌ Tâche refusée.';
          break;
        case 'delegated':
          message = '🔄 Tâche déléguée avec succès !';
          break;
        default:
          message = 'Réponse enregistrée.';
      }

      toast.success(message);
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
    setCurrentAssignmentId(assignmentId);
    setSelectedUserId('');
    setSearchTerm('');
    setShowDelegateModal(true);
  };

  const confirmDelegate = () => {
    if (!selectedUserId) {
      toast.warning('Veuillez sélectionner un auditeur');
      return;
    }
    handleResponse(currentAssignmentId, 'delegated', '', selectedUserId);
    setShowDelegateModal(false);
  };

  // Filtrer les auditeurs en fonction de la recherche
  const filteredUsers = availableUsers.filter(auditor => {
    if (!searchTerm.trim()) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      (auditor.name?.toLowerCase().includes(searchLower)) ||
      (auditor.email?.toLowerCase().includes(searchLower)) ||
      (auditor.specialty?.toLowerCase().includes(searchLower)) ||
      (auditor.grade?.toLowerCase().includes(searchLower))
    );
  });

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
                      <div className="card-header bg-gradient bg-primary text-white d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">{task.name}</h5>
                        <span className="badge bg-warning">⏱️ Délai : 24h</span>
                      </div>
                      <div className="card-body d-flex flex-column">
                        <p className="text-muted flex-grow-1">{task.description}</p>

                        <div className="row text-muted small mb-3">
                          <div className="col-md-6">
                            <strong>📅 Début :</strong> {new Date(task.startDate).toLocaleDateString()}
                          </div>
                          <div className="col-md-6">
                            <strong>📅 Fin :</strong> {new Date(task.endDate).toLocaleDateString()}
                          </div>
                        </div>

                        <div className="mb-3">
                          {task.specialties?.length > 0 && (
                            <div className="mb-2">
                              <strong>🎯 Spécialités :</strong>{' '}
                              <span className="badge bg-secondary me-1">
                                {task.specialties.join(', ')}
                              </span>
                            </div>
                          )}
                          {task.remunerated && (
                            <div className="text-success fw-bold">
                              💰 Rémunération : {task.remunerationAmount} DH
                            </div>
                          )}
                        </div>

                        <div className="mt-auto">
                          <div className="btn-group w-100" role="group">
                            <button
                              onClick={() => handleResponse(assignment._id, 'accepted')}
                              className="btn btn-success btn-lg"
                              title="Accepter cette tâche"
                            >
                              ✅ Accepter
                            </button>
                            <button
                              onClick={() => handleRefuse(assignment._id)}
                              className="btn btn-danger btn-lg"
                              title="Refuser cette tâche"
                            >
                              ❌ Refuser
                            </button>
                            <button
                              onClick={() => handleDelegate(assignment._id)}
                              className="btn btn-warning btn-lg"
                              title="Déléguer à un autre auditeur"
                            >
                              🔄 Déléguer
                            </button>
                          </div>
                        </div>

                        {assignment.justification && (
                          <small className="text-muted mt-3 text-end">
                            <em>📝 Raison : {assignment.justification}</em>
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
                Il sera affiché ici dès qu'un administrateur vous attribuera un véhicule.
              </small>
            </div>
          ) : (
            <div className="row g-3">
              {myVehicles.map((assignment) => (
                <div key={assignment._id} className="col-12">
                  <div className="card shadow-sm border-0">
                    <div className="card-header bg-info text-white d-flex justify-content-between align-items-center">
                      <h6 className="mb-0 fw-bold">
                        {assignment.vehicle.matricule} — {assignment.vehicle.marque} {assignment.vehicle.modele}
                      </h6>
                      <span className={`badge ${assignment.type === 'individuelle' ? 'bg-success' : 'bg-warning'}`}>
                        {assignment.type === 'individuelle' ? '👤 Individuelle' : '👥 Covoiturage'}
                      </span>
                    </div>
                    <div className="card-body small">
                      <div className="mb-2">
                        <strong>⛽ Carburant :</strong> {assignment.vehicle.carburant}
                      </div>

                      {assignment.type === 'partagée' && assignment.users?.length > 1 && (
                        <div className="mb-2">
                          <strong>👥 Collègues :</strong>{' '}
                          <div className="mt-1">
                            {assignment.users
                              .filter(u => u._id !== user._id)
                              .map(u => (
                                <span key={u._id} className="badge bg-secondary me-1 mb-1">
                                  {u.name}
                                </span>
                              ))}
                          </div>
                        </div>
                      )}

                      <div className="mb-2">
                        <strong>📅 Période :</strong>{' '}
                        {new Date(assignment.dateDebut).toLocaleDateString('fr-FR')}
                        {assignment.dateFin
                          ? ` → ${new Date(assignment.dateFin).toLocaleDateString('fr-FR')}`
                          : ' (en cours)'}
                      </div>

                      {assignment.direction && (
                        <div className="mb-2">
                          <strong>📍 Direction :</strong> {assignment.direction}
                        </div>
                      )}

                      {assignment.notes && (
                        <div className="mt-3 p-2 bg-light rounded">
                          <strong>📝 Notes :</strong> {assignment.notes}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal délégation */}
      <Modal
        show={showDelegateModal}
        onHide={() => setShowDelegateModal(false)}
        centered
        size="lg"
      >
        <Modal.Header closeButton className="bg-warning text-dark">
          <Modal.Title>
            <span className="me-2">🔄</span>
            Déléguer la tâche : {pendingTasks.find(t => t._id === currentAssignmentId)?.taskId?.name || 'Tâche'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted mb-4">
            Choisissez un auditeur à qui déléguer cette tâche.
          </p>

          {/* Recherche */}
          <Form.Group className="mb-3">
            <Form.Label>Rechercher un auditeur</Form.Label>
            <Form.Control
              type="text"
              placeholder="Nom, email, spécialité, grade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </Form.Group>

          {/* Liste des auditeurs */}
          {loadingUsers ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3">Chargement des auditeurs...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="alert alert-warning">
              Aucun auditeur trouvé {searchTerm && `pour "${searchTerm}"`}
            </div>
          ) : (
            <div className="list-group" style={{ maxHeight: '320px', overflowY: 'auto' }}>
              {filteredUsers.map((auditor) => (
                <label
                  key={auditor._id}
                  className={`list-group-item list-group-item-action d-flex align-items-center cursor-pointer ${
                    selectedUserId === auditor._id ? 'active' : ''
                  }`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSelectedUserId(auditor._id)}
                >
                  <input
                    type="radio"
                    name="auditor"
                    className="me-3"
                    checked={selectedUserId === auditor._id}
                    readOnly
                  />
                  <div className="flex-grow-1">
                    <div className="fw-bold">{auditor.name}</div>
                    <div className="small text-muted">
                      {auditor.email}
                      {auditor.specialty && ` • ${auditor.specialty}`}
                      {auditor.grade && ` • Grade ${auditor.grade}`}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDelegateModal(false)}>
            Annuler
          </Button>
          <Button
            variant="warning"
            onClick={confirmDelegate}
            disabled={!selectedUserId || loadingUsers}
          >
            Déléguer à cet auditeur
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default DashboardUser;