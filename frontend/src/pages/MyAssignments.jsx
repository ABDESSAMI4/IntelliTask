// src/pages/MyAssignments.jsx - Version corrigée ESLint
import { useEffect, useState, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import socket from '../services/socket';

const MyAssignments = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [responseData, setResponseData] = useState({
    status: 'accepted',
    justification: '',
    comment: '',
    delegatedTo: ''
  });
  const [availableUsers, setAvailableUsers] = useState([]);

  // Récupérer les affectations de l'utilisateur
  const fetchAssignments = useCallback(async () => {
    try {
      const res = await API.get('/assignments');
      setAssignments(res.data || []);
      setLoading(false);
    } catch (err) {
      toast.error('Impossible de charger vos affectations');
      setLoading(false);
    }
  }, []);

  // Récupérer les utilisateurs disponibles pour délégation
  const fetchAvailableUsers = useCallback(async () => {
    try {
      const res = await API.get('/users');
      // Filtrer les utilisateurs actifs et différents de l'utilisateur courant
      const filtered = res.data.filter(u => 
        u._id !== user.id && 
        u.active && 
        u.role === 'user'
      );
      setAvailableUsers(filtered);
    } catch (err) {
      console.error('Erreur chargement utilisateurs pour délégation:', err);
    }
  }, [user.id]);

  useEffect(() => {
    fetchAssignments();
    fetchAvailableUsers();
    
    // Écoute Socket.io pour les nouvelles affectations
    const handleNewAssignment = (data) => {
      toast.info(`Nouvelle affectation: ${data.taskName || 'Nouvelle tâche'}`);
      fetchAssignments();
    };

    // Écoute les modifications de tâches
    const handleTaskModified = (data) => {
      const affectedAssignment = assignments.find(a => a.taskId?._id === data.taskId);
      if (affectedAssignment) {
        toast.warning(`⚠️ Tâche modifiée: ${data.taskName || 'Tâche'}`);
        fetchAssignments();
      }
    };

    socket.on('newAssignment', handleNewAssignment);
    socket.on('taskModified', handleTaskModified);

    return () => {
      socket.off('newAssignment', handleNewAssignment);
      socket.off('taskModified', handleTaskModified);
    };
  }, [assignments, fetchAssignments, fetchAvailableUsers]);

  // Ouvrir modal de réponse
  const openResponseModal = (assignment) => {
    setSelectedAssignment(assignment);
    setResponseData({
      status: 'accepted',
      justification: '',
      comment: '',
      delegatedTo: ''
    });
    setShowResponseModal(true);
  };

  // Gérer réponse à une affectation
  const handleResponse = async () => {
    if (!selectedAssignment) return;

    // Validation
    if (responseData.status === 'refused' && !responseData.justification.trim()) {
      toast.error('Veuillez fournir une justification pour le refus');
      return;
    }

    if (responseData.status === 'delegated' && !responseData.delegatedTo) {
      toast.error('Veuillez sélectionner un auditeur pour la délégation');
      return;
    }

    try {
      await API.patch(`/assignments/response/${selectedAssignment._id}`, responseData);
      
      let message = '';
      switch(responseData.status) {
        case 'accepted':
          message = '✅ Affectation acceptée avec succès';
          break;
        case 'refused':
          message = '❌ Affectation refusée';
          break;
        case 'delegated':
          message = '🔄 Affectation déléguée';
          break;
        default:
          message = 'Réponse enregistrée';
      }
      
      toast.success(message);
      setShowResponseModal(false);
      fetchAssignments();
      
      // Si délégation, notifier le nouvel utilisateur via Socket.io
      if (responseData.status === 'delegated' && responseData.delegatedTo) {
        socket.emit('assignmentDelegated', {
          fromUserId: user.id,
          toUserId: responseData.delegatedTo,
          taskId: selectedAssignment.taskId?._id,
          taskName: selectedAssignment.taskId?.name
        });
      }
      
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la réponse');
    }
  };

  // Filtrer les affectations
  const filteredAssignments = assignments.filter(assignment => {
    if (filter === 'all') return true;
    return assignment.status === filter;
  });

  // Formater la date
  const formatDate = (dateString) => {
    if (!dateString) return 'Non définie';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculer le temps restant pour répondre (24h)
  const getTimeRemaining = (createdAt) => {
    if (!createdAt) return 'N/A';
    const created = new Date(createdAt);
    const now = new Date();
    const deadline = new Date(created.getTime() + 24 * 60 * 60 * 1000);
    
    if (now > deadline) return 'Délai expiré';
    
    const diff = deadline - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  // Obtenir le badge selon le statut
  const getStatusBadge = (status) => {
    const badges = {
      pending: { label: 'En attente', color: 'warning', icon: '⏳' },
      accepted: { label: 'Acceptée', color: 'success', icon: '✅' },
      refused: { label: 'Refusée', color: 'danger', icon: '❌' },
      delegated: { label: 'Déléguée', color: 'info', icon: '🔄' }
    };
    return badges[status] || { label: status, color: 'secondary', icon: '❓' };
  };

  if (loading) {
    return (
      <div className="container py-5">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" style={{width: '3rem', height: '3rem'}} role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
          <p className="mt-3">Chargement de vos affectations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      {/* En-tête */}
      <div className="text-center mb-5">
        <h1 className="display-5 fw-bold text-primary mb-3">📋 Mes Affectations</h1>
        <p className="lead text-muted">
          Gérez vos tâches assignées : acceptez, refusez ou déléguez dans les 24 heures
        </p>
      </div>

      {/* Filtres */}
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <div className="row align-items-center">
            <div className="col-md-6">
              <h5 className="mb-0">Filtrer par statut :</h5>
            </div>
            <div className="col-md-6">
              <div className="btn-group w-100" role="group">
                {['all', 'pending', 'accepted', 'refused', 'delegated'].map((f) => (
                  <button
                    key={f}
                    type="button"
                    className={`btn ${filter === f ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setFilter(f)}
                  >
                    {f === 'all' ? 'Toutes' : 
                     f === 'pending' ? '⏳ En attente' :
                     f === 'accepted' ? '✅ Acceptées' :
                     f === 'refused' ? '❌ Refusées' : '🔄 Déléguées'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des affectations */}
      {filteredAssignments.length === 0 ? (
        <div className="alert alert-info text-center py-5 shadow">
          <div className="display-1 mb-4">📭</div>
          <h4>
            {filter === 'all' 
              ? 'Aucune affectation' 
              : `Aucune affectation avec le statut "${filter}"`}
          </h4>
          <p className="mb-0">
            {filter === 'pending' 
              ? 'Aucune tâche en attente de réponse' 
              : filter === 'accepted'
              ? 'Aucune tâche acceptée actuellement'
              : 'Vous n\'avez aucune affectation pour le moment'}
          </p>
        </div>
      ) : (
        <div className="row g-4">
          {filteredAssignments.map(assignment => {
            const statusBadge = getStatusBadge(assignment.status);
            const task = assignment.taskId;
            
            return (
              <div key={assignment._id} className="col-12">
                <div className="card shadow-lg border-0">
                  {/* En-tête avec statut et actions */}
                  <div className="card-header bg-gradient bg-primary text-white d-flex justify-content-between align-items-center">
                    <div>
                      <h5 className="mb-0">{task?.name || 'Tâche sans nom'}</h5>
                      <small className="opacity-75">
                        Assignée le {formatDate(assignment.createdAt)}
                      </small>
                    </div>
                    <div className="d-flex align-items-center gap-3">
                      <span className={`badge bg-${statusBadge.color} fs-6`}>
                        {statusBadge.icon} {statusBadge.label}
                      </span>
                      
                      {assignment.status === 'pending' && (
                        <div className="d-flex flex-column align-items-end">
                          <small className="text-warning fw-bold">
                            ⏱ {getTimeRemaining(assignment.createdAt)}
                          </small>
                          <button 
                            className="btn btn-sm btn-light mt-1"
                            onClick={() => openResponseModal(assignment)}
                          >
                            Répondre
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Corps de la carte */}
                  <div className="card-body">
                    <div className="row">
                      {/* Informations de la tâche */}
                      <div className="col-md-8">
                        <p className="card-text">{task?.description || 'Pas de description'}</p>
                        
                        {/* Détails de la tâche */}
                        <div className="row small text-muted mt-3">
                          <div className="col-md-4 mb-2">
                            <strong>📅 Début :</strong><br />
                            {task?.startDate ? formatDate(task.startDate) : 'Non définie'}
                          </div>
                          <div className="col-md-4 mb-2">
                            <strong>📅 Fin :</strong><br />
                            {task?.endDate ? formatDate(task.endDate) : 'Non définie'}
                          </div>
                          <div className="col-md-4 mb-2">
                            <strong>💰 Rémunération :</strong><br />
                            {task?.remunerated 
                              ? `${task.remunerationAmount || 0} DH` 
                              : 'Non rémunérée'}
                          </div>
                        </div>

                        {/* Spécialités et grades */}
                        <div className="row small text-muted mt-2">
                          <div className="col-md-6">
                            <strong>🎯 Spécialités :</strong><br />
                            {task?.specialties?.length 
                              ? task.specialties.join(', ') 
                              : 'Toutes'}
                          </div>
                          <div className="col-md-6">
                            <strong>⭐ Grades :</strong><br />
                            {task?.grades?.length 
                              ? task.grades.join(', ') 
                              : 'Tous'}
                          </div>
                        </div>

                        {/* Fichier PDF joint */}
                        {task?.adminFile && (
                          <div className="mt-3">
                            <a 
                              href={task.adminFile} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="btn btn-sm btn-info"
                            >
                              📄 Voir le PDF joint
                            </a>
                          </div>
                        )}

                        {/* Justification (si refus ou délégation) */}
                        {assignment.justification && (
                          <div className="mt-3 p-3 bg-light rounded border">
                            <strong>📝 Votre justification :</strong><br />
                            {assignment.justification}
                          </div>
                        )}
                      </div>

                      {/* Actions et informations complémentaires */}
                      <div className="col-md-4 border-start">
                        <div className="d-flex flex-column h-100">
                          {/* Informations sur la délégation */}
                          {assignment.status === 'delegated' && assignment.comment && (
                            <div className="mb-3 p-3 bg-info bg-opacity-10 rounded">
                              <strong>🔄 Délégation :</strong><br />
                              <small>{assignment.comment}</small>
                            </div>
                          )}

                          {/* Bouton de réponse si pending */}
                          {assignment.status === 'pending' && (
                            <div className="mt-auto">
                              <button 
                                className="btn btn-primary w-100 btn-lg"
                                onClick={() => openResponseModal(assignment)}
                              >
                                📤 Répondre à cette affectation
                              </button>
                              <small className="text-muted d-block mt-2 text-center">
                                ⚠️ Délai de réponse : 24h
                              </small>
                            </div>
                          )}

                          {/* Informations sur l'auto-acceptation */}
                          {assignment.status === 'accepted' && assignment.justification?.includes('(Auto-accepté') && (
                            <div className="alert alert-warning mt-3 mb-0">
                              <small>
                                <strong>⚠️ Auto-acceptation :</strong> Cette tâche a été 
                                automatiquement acceptée après 24h sans réponse.
                              </small>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pied de carte avec actions supplémentaires */}
                  <div className="card-footer bg-white d-flex justify-content-between">
                    <small className="text-muted">
                      ID: {assignment._id?.substring(0, 8)}...
                    </small>
                    <div>
                      {assignment.status === 'accepted' && (
                        <button 
                          className="btn btn-sm btn-outline-success me-2"
                          onClick={() => navigate(`/tasks/${task?._id}`)}
                        >
                          📋 Voir détails
                        </button>
                      )}
                      <button 
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => navigate('/history')}
                      >
                        📜 Historique
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de réponse */}
      {showResponseModal && selectedAssignment && (
        <div className="modal fade show d-block" style={{background: 'rgba(0,0,0,0.5)'}} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">
                  Répondre à l'affectation : {selectedAssignment.taskId?.name}
                </h5>
                <button 
                  type="button" 
                  className="btn-close btn-close-white"
                  onClick={() => setShowResponseModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                {/* Choix du statut */}
                <div className="mb-4">
                  <label className="form-label fw-bold">Votre réponse :</label>
                  <div className="btn-group w-100" role="group">
                    <button
                      type="button"
                      className={`btn ${responseData.status === 'accepted' ? 'btn-success' : 'btn-outline-success'}`}
                      onClick={() => setResponseData({...responseData, status: 'accepted'})}
                    >
                      ✅ Accepter
                    </button>
                    <button
                      type="button"
                      className={`btn ${responseData.status === 'refused' ? 'btn-danger' : 'btn-outline-danger'}`}
                      onClick={() => setResponseData({...responseData, status: 'refused'})}
                    >
                      ❌ Refuser
                    </button>
                    <button
                      type="button"
                      className={`btn ${responseData.status === 'delegated' ? 'btn-info' : 'btn-outline-info'}`}
                      onClick={() => setResponseData({...responseData, status: 'delegated'})}
                    >
                      🔄 Déléguer
                    </button>
                  </div>
                </div>

                {/* Justification (obligatoire pour refus) */}
                {(responseData.status === 'refused' || responseData.status === 'delegated') && (
                  <div className="mb-3">
                    <label className="form-label fw-bold">
                      {responseData.status === 'refused' 
                        ? 'Justification du refus (obligatoire)' 
                        : 'Commentaire (optionnel)'}
                    </label>
                    <textarea
                      className="form-control"
                      rows="3"
                      placeholder={
                        responseData.status === 'refused' 
                          ? 'Expliquez pourquoi vous refusez cette tâche...'
                          : 'Ajoutez un commentaire pour la délégation...'
                      }
                      value={responseData.justification}
                      onChange={(e) => setResponseData({...responseData, justification: e.target.value})}
                      required={responseData.status === 'refused'}
                    />
                  </div>
                )}

                {/* Sélection de l'utilisateur pour délégation */}
                {responseData.status === 'delegated' && (
                  <div className="mb-3">
                    <label className="form-label fw-bold">Déléguer à :</label>
                    <select
                      className="form-select"
                      value={responseData.delegatedTo}
                      onChange={(e) => setResponseData({...responseData, delegatedTo: e.target.value})}
                      required
                    >
                      <option value="">Choisissez un auditeur</option>
                      {availableUsers.map(u => (
                        <option key={u._id} value={u._id}>
                          {u.name} ({u.specialty || 'Aucune spécialité'}) - Grade {u.grade || 'N/A'}
                        </option>
                      ))}
                    </select>
                    <small className="text-muted">
                      L'auditeur devra accepter la délégation dans les 24h
                    </small>
                  </div>
                )}

                {/* Commentaire optionnel */}
                <div className="mb-3">
                  <label className="form-label fw-bold">Commentaire (optionnel) :</label>
                  <textarea
                    className="form-control"
                    rows="2"
                    placeholder="Ajoutez un commentaire supplémentaire..."
                    value={responseData.comment}
                    onChange={(e) => setResponseData({...responseData, comment: e.target.value})}
                  />
                </div>

                {/* Information sur le délai */}
                <div className="alert alert-info">
                  <small>
                    ⏱ <strong>Délai de 24h :</strong> 
                    {selectedAssignment.createdAt && (
                      <> Temps restant : {getTimeRemaining(selectedAssignment.createdAt)}</>
                    )}
                    <br />
                    Après ce délai, la tâche sera automatiquement acceptée.
                  </small>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowResponseModal(false)}
                >
                  Annuler
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={handleResponse}
                  disabled={
                    (responseData.status === 'refused' && !responseData.justification.trim()) ||
                    (responseData.status === 'delegated' && !responseData.delegatedTo)
                  }
                >
                  Confirmer la réponse
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Statistiques */}
      <div className="mt-5">
        <div className="row g-4">
          <div className="col-md-3">
            <div className="card text-center p-3 shadow-sm">
              <h3 className="text-primary">{assignments.length}</h3>
              <p className="mb-0">Total affectations</p>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center p-3 shadow-sm">
              <h3 className="text-warning">
                {assignments.filter(a => a.status === 'pending').length}
              </h3>
              <p className="mb-0">En attente</p>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center p-3 shadow-sm">
              <h3 className="text-success">
                {assignments.filter(a => a.status === 'accepted').length}
              </h3>
              <p className="mb-0">Acceptées</p>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center p-3 shadow-sm">
              <h3 className="text-info">
                {assignments.filter(a => a.status === 'delegated').length}
              </h3>
              <p className="mb-0">Déléguées</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyAssignments;