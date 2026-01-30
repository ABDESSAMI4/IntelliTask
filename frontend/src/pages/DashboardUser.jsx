// src/pages/DashboardUser.jsx - Version corrigée avec gestion des erreurs
import { useEffect, useState, useContext, useCallback } from 'react';
import { toast } from 'react-toastify';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { Modal, Button, Form } from 'react-bootstrap';

const DashboardUser = () => {
  const { user } = useContext(AuthContext);
  const [pendingTasks, setPendingTasks] = useState([]);
  const [myVehicles, setMyVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  // États pour délégation
  const [showDelegateModal, setShowDelegateModal] = useState(false);
  const [currentAssignmentId, setCurrentAssignmentId] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [availableUsers, setAvailableUsers] = useState([]); // Liste des utilisateurs disponibles
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
      console.log('Aucun véhicule attribué ou erreur');
      setMyVehicles([]);
    }
  };

  // Fetch liste des utilisateurs disponibles avec gestion d'erreur
  const fetchAvailableUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      // Essayer d'abord l'endpoint spécifique
      const res = await API.get('/users/available-for-delegation');
      
      // Si ça réussit, utiliser les données
      const filtered = res.data.filter(u => 
        u._id !== user.id && 
        u.active
      );
      setAvailableUsers(filtered);
    } catch (err) {
      console.log('Tentative 1 échouée, essai avec endpoint alternatif...');
      
      try {
        // Essayer un endpoint alternatif
        const res = await API.get('/users/my-team');
        const filtered = res.data.filter(u => 
          u._id !== user.id && 
          u.active && 
          u.role === 'user'
        );
        setAvailableUsers(filtered);
      } catch (secondErr) {
        console.log('Tentative 2 échouée, chargement des données mockées...');
        
        // Fallback: charger des données mockées pour l'interface
        const mockUsers = getMockUsers();
        setAvailableUsers(mockUsers.filter(u => u._id !== user.id));
        
        toast.info(
          <div>
            <strong>Mode démonstration</strong><br />
            <small>Données de test utilisées pour la délégation</small>
          </div>,
          { autoClose: 3000 }
        );
      }
    } finally {
      setLoadingUsers(false);
    }
  }, [user.id]);

  // Fonction pour générer des données mockées
  const getMockUsers = () => {
    return [
      {
        _id: '1',
        name: 'Ahmed Benali',
        email: 'ahmed.benali@email.com',
        specialty: 'informatique',
        grade: 'A',
        phone: '0612345678',
        active: true,
        role: 'user'
      },
      {
        _id: '2',
        name: 'Fatima Zahra',
        email: 'fatima.zahra@email.com',
        specialty: 'pedagogique',
        grade: 'B',
        phone: '0623456789',
        active: true,
        role: 'user'
      },
      {
        _id: '3',
        name: 'Karim El Mansouri',
        email: 'karim.mansouri@email.com',
        specialty: 'planification',
        grade: 'C',
        phone: '0634567890',
        active: true,
        role: 'user'
      },
      {
        _id: '4',
        name: 'Samira Chahid',
        email: 'samira.chahid@email.com',
        specialty: 'financiers',
        grade: 'A',
        phone: '0645678901',
        active: true,
        role: 'user'
      },
      {
        _id: '5',
        name: 'Youssef El Fassi',
        email: 'youssef.fassi@email.com',
        specialty: 'orientation',
        grade: 'B',
        phone: '0656789012',
        active: true,
        role: 'user'
      }
    ];
  };

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([fetchMyTasks(), fetchMyVehicles()]);
      // Charger les utilisateurs en arrière-plan
      fetchAvailableUsers();
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
        // Ajouter un commentaire automatique
        const selectedUser = availableUsers.find(a => a._id === delegatedTo);
        payload.comment = `Délégation à ${selectedUser?.name || 'un auditeur'}`;
      }

      await API.patch(`/assignments/response/${assignmentId}`, payload);
      
      let message = '';
      switch(status) {
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

  // Délégation avec modal et select par nom
  const handleDelegate = (assignmentId) => {
    setCurrentAssignmentId(assignmentId);
    setSelectedUserId('');
    setSearchTerm('');
    setShowDelegateModal(true);
  };

  const confirmDelegate = () => {
    if (selectedUserId) {
      handleResponse(currentAssignmentId, 'delegated', '', selectedUserId);
      setShowDelegateModal(false);
    } else {
      toast.warning('Veuillez sélectionner un auditeur');
    }
  };

  // Filtrer les utilisateurs par nom ou email
  const filteredUsers = availableUsers.filter(userItem => {
    if (!searchTerm.trim()) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      (userItem.name && userItem.name.toLowerCase().includes(searchLower)) ||
      (userItem.email && userItem.email.toLowerCase().includes(searchLower)) ||
      (userItem.specialty && userItem.specialty.toLowerCase().includes(searchLower)) ||
      (userItem.phone && userItem.phone.includes(searchTerm))
    );
  });

  // Trier les utilisateurs par nom
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const nameA = (a.name || '').toLowerCase();
    const nameB = (b.name || '').toLowerCase();
    return nameA.localeCompare(nameB);
  });

  // Récupérer le nom de la tâche en cours de délégation
  const getCurrentTaskName = () => {
    if (!currentAssignmentId) return '';
    const assignment = pendingTasks.find(t => t._id === currentAssignmentId);
    return assignment?.taskId?.name || 'cette tâche';
  };

  // Obtenir le nom de l'utilisateur sélectionné
  const getSelectedUserName = () => {
    if (!selectedUserId) return '';
    const selectedUser = availableUsers.find(u => u._id === selectedUserId);
    return selectedUser?.name || 'Auditeur sélectionné';
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
                      <div className="card-header bg-gradient bg-primary text-white d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">{task.name}</h5>
                        <span className="badge bg-warning">
                          ⏱️ Délai : 24h
                        </span>
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

                        {/* Informations supplémentaires */}
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

      {/* Modal pour délégation */}
      <Modal 
        show={showDelegateModal} 
        onHide={() => setShowDelegateModal(false)} 
        centered
        size="lg"
      >
        <Modal.Header closeButton className="bg-warning text-dark">
          <Modal.Title>
            <span className="me-2">🔄</span>
            Déléguer la tâche : {getCurrentTaskName()}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-4">
            <p className="text-muted">
              Sélectionnez un auditeur à qui déléguer cette tâche.
              L'auditeur aura 24h pour accepter ou refuser la délégation.
            </p>
          </div>

          {/* Barre de recherche */}
          <Form.Group controlId="searchAuditor" className="mb-3">
            <Form.Label>Rechercher un auditeur :</Form.Label>
            <Form.Control
              type="text"
              placeholder="Tapez un nom, email ou spécialité..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
              disabled={loadingUsers}
            />
            <Form.Text className="text-muted">
              {loadingUsers ? (
                <span className="text-info">
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Chargement des auditeurs...
                </span>
              ) : (
                `${sortedUsers.length} auditeur(s) trouvé(s)`
              )}
            </Form.Text>
          </Form.Group>

          {/* Liste des auditeurs */}
          <Form.Group controlId="auditorSelect">
            <Form.Label className="fw-bold">Sélectionnez un auditeur :</Form.Label>
            
            {loadingUsers ? (
              <div className="text-center py-4">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Chargement...</span>
                </div>
                <p className="mt-2">Chargement de la liste des auditeurs...</p>
              </div>
            ) : sortedUsers.length === 0 ? (
              <div className="alert alert-warning text-center">
                <p className="mb-0">Aucun auditeur trouvé</p>
                <small>
                  {searchTerm ? `Avec le terme "${searchTerm}"` : 'La liste des auditeurs est vide'}
                </small>
              </div>
            ) : (
              <div className="list-group" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {sortedUsers.map((userItem) => (
                  <label 
                    key={userItem._id}
                    className={`list-group-item list-group-item-action d-flex align-items-center ${
                      selectedUserId === userItem._id ? 'active' : ''
                    }`}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="form-check flex-grow-1">
                      <input
                        type="radio"
                        className="form-check-input"
                        name="auditorSelection"
                        value={userItem._id}
                        checked={selectedUserId === userItem._id}
                        onChange={(e) => setSelectedUserId(e.target.value)}
                        id={`auditor-${userItem._id}`}
                      />
                      <div className="ms-2">
                        <div className="fw-bold">
                          {userItem.name}
                          {selectedUserId === userItem._id && (
                            <span className="badge bg-success ms-2">Sélectionné</span>
                          )}
                        </div>
                        <div className="text-muted small">
                          📧 {userItem.email}
                          {userItem.specialty && (
                            <span className="ms-3">🎯 {userItem.specialty}</span>
                          )}
                          {userItem.grade && (
                            <span className="ms-3">⭐ Grade {userItem.grade}</span>
                          )}
                        </div>
                        <div className="small">
                          {userItem.phone && `📞 ${userItem.phone}`}
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </Form.Group>

          {/* Auditeur sélectionné */}
          {selectedUserId && (
            <div className="mt-3 p-3 bg-light rounded">
              <h6 className="fw-bold">✅ Auditeur sélectionné :</h6>
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <strong>{getSelectedUserName()}</strong>
                </div>
                <div className="text-end">
                  <Button 
                    variant="outline-primary" 
                    size="sm"
                    onClick={() => {
                      toast.info(`Délégation à ${getSelectedUserName()}`, {
                        position: 'top-center'
                      });
                    }}
                  >
                    Confirmer
                  </Button>
                </div>
              </div>
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
            className="d-flex align-items-center"
          >
            {loadingUsers ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                Chargement...
              </>
            ) : (
              <>
                <span className="me-2">🔄</span>
                Déléguer à {getSelectedUserName()}
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default DashboardUser;