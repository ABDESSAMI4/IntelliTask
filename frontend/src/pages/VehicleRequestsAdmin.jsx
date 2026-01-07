// src/pages/VehicleRequestsAdmin.jsx
import { useEffect, useState } from 'react';
import API from '../services/api';
import { toast } from 'react-toastify';

const VehicleRequestsAdmin = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [showRefuseModal, setShowRefuseModal] = useState(false);
  const [currentRequestId, setCurrentRequestId] = useState(null);
  const [justification, setJustification] = useState('');

  const fetchRequests = async () => {
    try {
      const res = await API.get('/vehicle-requests');
      setRequests(res.data || []);
    } catch (err) {
      toast.error('Erreur lors du chargement des demandes');
      console.error('Erreur fetch requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleResponse = async (requestId, status, justif = '') => {
    setProcessingId(requestId);
    try {
      const body = { status };
      if (status === 'refusée') {
        body.justification = justif.trim() || 'Aucun motif précisé';
      }

      const res = await API.patch(`/vehicle-requests/${requestId}/response`, body);

      toast.success(res.data.message || 'Demande traitée avec succès !');
      await fetchRequests(); // Rafraîchit la liste
      setShowRefuseModal(false);
      setJustification('');
      setCurrentRequestId(null);
    } catch (err) {
      console.error('Erreur traitement demande:', err.response || err);

      const serverMsg = err.response?.data?.message;
      const statusCode = err.response?.status;

      let errorMsg = 'Erreur lors du traitement de la demande';

      if (statusCode === 400 && serverMsg?.includes('déjà attribué')) {
        errorMsg = 'Véhicule déjà attribué à cette période';
      } else if (statusCode === 404) {
        errorMsg = 'Demande non trouvée';
      } else if (statusCode === 403) {
        errorMsg = 'Accès refusé';
      } else if (serverMsg) {
        errorMsg = serverMsg;
      }

      toast.error(errorMsg);
    } finally {
      setProcessingId(null);
    }
  };

  const openRefuseModal = (id) => {
    setCurrentRequestId(id);
    setJustification('');
    setShowRefuseModal(true);
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
        <p className="mt-3 fs-5">Chargement des demandes de véhicules...</p>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <h2 className="text-primary fw-bold mb-5 text-center">
        🚗 Gestion des Demandes de Véhicules
      </h2>

      {requests.length === 0 ? (
        <div className="alert alert-info text-center py-5 shadow-sm rounded">
          <p className="mb-0 fs-4 fw-semibold">Aucune demande en attente pour le moment.</p>
          <p className="text-muted">Les nouvelles demandes apparaîtront ici automatiquement.</p>
        </div>
      ) : (
        <div className="row g-4">
          {requests.map((req) => (
            <div key={req._id} className="col-md-6 col-lg-4">
              <div className="card shadow-sm h-100 border-0">
                <div className="card-header bg-primary text-white">
                  <h5 className="mb-0">
                    {req.vehicle?.matricule || 'Véhicule inconnu'} - {req.vehicle?.marque || ''} {req.vehicle?.modele || ''}
                  </h5>
                </div>
                <div className="card-body">
                  <p className="mb-2">
                    <strong>Auditeur :</strong> {req.user?.name || 'Inconnu'} ({req.user?.email || 'N/A'})
                  </p>
                  <p className="mb-2">
                    <strong>Période :</strong>{' '}
                    {new Date(req.dateDebut).toLocaleDateString('fr-FR')}
                    {req.dateFin && ` → ${new Date(req.dateFin).toLocaleDateString('fr-FR')}`}
                    {!req.dateFin && ' (journée unique)'}
                  </p>
                  <p className="mb-2">
                    <strong>Direction :</strong> {req.direction || 'Non spécifiée'}
                  </p>
                  <p className="mb-2">
                    <strong>Notes :</strong> {req.notes || 'Aucune'}
                  </p>
                </div>
                <div className="card-footer bg-light d-flex gap-2">
                  <button
                    className="btn btn-success flex-fill"
                    onClick={() => handleResponse(req._id, 'acceptée')}
                    disabled={processingId === req._id}
                  >
                    {processingId === req._id ? 'Traitement...' : '✓ Accepter'}
                  </button>
                  <button
                    className="btn btn-danger flex-fill"
                    onClick={() => openRefuseModal(req._id)}
                    disabled={processingId === req._id}
                  >
                    {processingId === req._id ? 'Traitement...' : '✗ Refuser'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de refus */}
      {showRefuseModal && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}
          onClick={() => setShowRefuseModal(false)}
        >
          <div
            className="bg-white rounded-3 shadow-lg p-4"
            style={{ maxWidth: '500px', width: '90%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h5 className="fw-bold mb-3">Motif du refus (facultatif)</h5>
            <textarea
              className="form-control mb-3"
              rows="4"
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Ex: Véhicule déjà réservé pour cette période..."
            />
            <div className="d-flex justify-content-end gap-2">
              <button className="btn btn-secondary" onClick={() => setShowRefuseModal(false)}>
                Annuler
              </button>
              <button
                className="btn btn-danger"
                onClick={() => handleResponse(currentRequestId, 'refusée', justification)}
              >
                Confirmer le refus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleRequestsAdmin;