// src/pages/VehicleList.jsx - Version finale corrigée et fonctionnelle
import { useEffect, useState } from 'react';
import API from '../services/api';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';

const VehicleList = () => {
  const [vehicles, setVehicles] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showGlobalAssignModal, setShowGlobalAssignModal] = useState(false);

  const [editingVehicle, setEditingVehicle] = useState(null);

  // Formulaires
  const [vehicleForm, setVehicleForm] = useState({
    matricule: '',
    marque: '',
    modele: '',
    annee: '',
    type: 'Voiture',
    carburant: 'Diesel',
    notes: ''
  });

  const [assignForm, setAssignForm] = useState({
    vehicle: '',
    users: [],
    type: 'individuelle',
    dateDebut: '',
    dateFin: '',
    direction: '',
    notes: ''
  });

  // Recherche & filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    etat: 'tous',
    type: 'tous',
    carburant: 'tous',
    availableOnly: false
  });

  // Chargement données
  const fetchVehicles = async () => {
    try {
      const res = await API.get('/vehicles');
      setVehicles(res.data || []);
    } catch (err) {
      toast.error('Erreur lors du chargement des véhicules');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await API.get('/users');
      setAllUsers(res.data.filter(u => u.active && u.role === 'user'));
    } catch (err) {
      console.error('Erreur chargement auditeurs');
    }
  };

  useEffect(() => {
    fetchVehicles();
    fetchUsers();
  }, []);

  // Filtrage des véhicules
  const filteredVehicles = vehicles.filter(vehicle => {
    const search = searchTerm.toLowerCase();
    const matchesSearch = 
      vehicle.matricule.toLowerCase().includes(search) ||
      vehicle.marque.toLowerCase().includes(search) ||
      vehicle.modele.toLowerCase().includes(search) ||
      (vehicle.notes && vehicle.notes.toLowerCase().includes(search));

    const matchesEtat = filters.etat === 'tous' || vehicle.etat === filters.etat;
    const matchesType = filters.type === 'tous' || vehicle.type === filters.type;
    const matchesCarburant = filters.carburant === 'tous' || vehicle.carburant === filters.carburant;
    const matchesAvailable = !filters.availableOnly || vehicle.etat === 'Disponible';

    return matchesSearch && matchesEtat && matchesType && matchesCarburant && matchesAvailable;
  });

  // Modal Ajouter/Modifier véhicule
  const openVehicleModal = (vehicle = null) => {
    setEditingVehicle(vehicle);
    setVehicleForm(vehicle ? {
      matricule: vehicle.matricule,
      marque: vehicle.marque,
      modele: vehicle.modele,
      annee: vehicle.annee,
      type: vehicle.type,
      carburant: vehicle.carburant,
      notes: vehicle.notes || ''
    } : {
      matricule: '',
      marque: '',
      modele: '',
      annee: '',
      type: 'Voiture',
      carburant: 'Diesel',
      notes: ''
    });
    setShowAddEditModal(true);
  };

  const handleVehicleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingVehicle) {
        await API.put(`/vehicles/${editingVehicle._id}`, vehicleForm);
        toast.success('Véhicule mis à jour avec succès !');
      } else {
        await API.post('/vehicles', vehicleForm);
        toast.success('Véhicule ajouté avec succès !');
      }
      fetchVehicles();
      setShowAddEditModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de l\'opération');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer définitivement ce véhicule ?')) return;
    try {
      await API.delete(`/vehicles/${id}`);
      toast.success('Véhicule supprimé');
      fetchVehicles();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Impossible de supprimer');
    }
  };

  // OUVERTURE MODALE D'ATTRIBUTION DEPUIS UNE CARTE VÉHICULE
  const openAssignModal = (vehicleId) => {
    setAssignForm({
      vehicle: vehicleId, // ← CRUCIAL : pré-remplir l'ID du véhicule
      users: [],
      type: 'individuelle',
      dateDebut: '',
      dateFin: '',
      direction: '',
      notes: ''
    });
    setShowAssignModal(true);
  };

  // Attribution globale (bouton dédié)
  const resetAssignForm = () => {
    setAssignForm({
      vehicle: '',
      users: [],
      type: 'individuelle',
      dateDebut: '',
      dateFin: '',
      direction: '',
      notes: ''
    });
  };

  const handleAssignChange = (e) => {
    const { name, value } = e.target;
    if (name === 'users') {
      const selected = Array.from(e.target.selectedOptions, option => option.value);
      setAssignForm(prev => ({ ...prev, users: selected }));
    } else {
      setAssignForm(prev => ({ ...prev, [name]: value }));
    }
  };

  // SOUMISSION ATTRIBUTION (modale carte ou globale)
  const handleAssignSubmit = async (e) => {
    e.preventDefault();

    // Validation claire
    if (!assignForm.vehicle) {
      toast.error('Véhicule requis');
      return;
    }
    if (assignForm.users.length === 0) {
      toast.error('Sélectionnez au moins un auditeur');
      return;
    }
    if (!assignForm.dateDebut) {
      toast.error('Date de début obligatoire');
      return;
    }
    if (assignForm.type === 'partagée' && assignForm.users.length < 2) {
      toast.error('Minimum 2 auditeurs pour une attribution partagée');
      return;
    }

    try {
      await API.post('/vehicle-assignments', assignForm);
      toast.success('Véhicule attribué avec succès ! 🚗');
      setShowAssignModal(false);
      setShowGlobalAssignModal(false);
      resetAssignForm();
      fetchVehicles(); // Rafraîchit les badges Disponible/Attribué
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de l\'attribution');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
        <p className="mt-3 fs-5">Chargement du parc automobile...</p>
      </div>
    );
  }

  return (
    <div className="container py-5">
      {/* En-tête */}
      <div className="d-flex justify-content-between align-items-center mb-5">
        <h2 className="text-primary fw-bold">🚗 Parc Véhicules</h2>
        <div className="d-flex gap-3 flex-wrap">
          <Link to="/admin/vehicle-requests" className="btn btn-warning btn-lg px-4 shadow">
            📥 Gérer les demandes
          </Link>
          <button
            className="btn btn-info btn-lg px-4 shadow text-white"
            onClick={() => {
              resetAssignForm();
              setShowGlobalAssignModal(true);
            }}
          >
            🔄 Attribuer un véhicule
          </button>
          <button className="btn btn-success btn-lg px-5 shadow" onClick={() => openVehicleModal()}>
            + Ajouter
          </button>
        </div>
      </div>

      {/* Recherche et filtres */}
      <div className="card shadow-sm mb-4 p-4">
        <input
          type="text"
          className="form-control mb-3"
          placeholder="Rechercher par matricule, marque, modèle..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="row g-3 align-items-center">
          <div className="col-md-3">
            <select className="form-select" value={filters.etat} onChange={(e) => setFilters({ ...filters, etat: e.target.value })}>
              <option value="tous">État : Tous</option>
              <option value="Disponible">Disponible</option>
              <option value="Attribué">Attribué</option>
            </select>
          </div>
          <div className="col-md-3">
            <select className="form-select" value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}>
              <option value="tous">Type : Tous</option>
              <option value="Voiture">Voiture</option>
              <option value="Utilitaire">Utilitaire</option>
              <option value="Moto">Moto</option>
              <option value="Camion">Camion</option>
            </select>
          </div>
          <div className="col-md-3">
            <select className="form-select" value={filters.carburant} onChange={(e) => setFilters({ ...filters, carburant: e.target.value })}>
              <option value="tous">Carburant : Tous</option>
              <option value="Essence">Essence</option>
              <option value="Diesel">Diesel</option>
              <option value="Électrique">Électrique</option>
              <option value="Hybride">Hybride</option>
            </select>
          </div>
          <div className="col-md-3">
            <div className="form-check form-switch d-flex align-items-center">
              <input
                className="form-check-input me-2"
                type="checkbox"
                checked={filters.availableOnly}
                onChange={(e) => setFilters({ ...filters, availableOnly: e.target.checked })}
              />
              <label className="form-check-label">Disponibles seulement</label>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des véhicules */}
      {filteredVehicles.length === 0 ? (
        <div className="alert alert-info text-center py-5 shadow-sm">
          <h4>Aucun véhicule correspondant à vos critères</h4>
        </div>
      ) : (
        <div className="row g-4">
          {filteredVehicles.map(vehicle => (
            <div key={vehicle._id} className="col-md-6 col-lg-4">
              <div className="card shadow h-100 border-0">
                <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">{vehicle.matricule}</h5>
                  <span className={`badge fs-6 ${vehicle.etat === 'Disponible' ? 'bg-success' : 'bg-warning'}`}>
                    {vehicle.etat}
                  </span>
                </div>
                <div className="card-body">
                  <p><strong>Marque :</strong> {vehicle.marque}</p>
                  <p><strong>Modèle :</strong> {vehicle.modele}</p>
                  <p><strong>Année :</strong> {vehicle.annee}</p>
                  <p><strong>Type :</strong> {vehicle.type}</p>
                  <p><strong>Carburant :</strong> {vehicle.carburant}</p>
                  {vehicle.notes && <p className="text-muted"><em>{vehicle.notes}</em></p>}

                  {vehicle.attributionActuelle && (
                    <div className="mt-3 p-3 bg-light rounded border-start border-primary border-3">
                      <strong>Attribué à :</strong> {vehicle.attributionActuelle.users}<br />
                      <strong>Période :</strong> {new Date(vehicle.attributionActuelle.dateDebut).toLocaleDateString('fr-FR')}
                      {vehicle.attributionActuelle.dateFin && ` → ${new Date(vehicle.attributionActuelle.dateFin).toLocaleDateString('fr-FR')}`}
                      {vehicle.attributionActuelle.direction && <><br /><strong>Direction :</strong> {vehicle.attributionActuelle.direction}</>}
                    </div>
                  )}
                </div>
                <div className="card-footer bg-white d-flex gap-2">
                  <button className="btn btn-outline-primary flex-fill" onClick={() => openVehicleModal(vehicle)}>
                    ✏️ Modifier
                  </button>
                  <button className="btn btn-outline-danger flex-fill" onClick={() => handleDelete(vehicle._id)}>
                    🗑️ Supprimer
                  </button>
                  {vehicle.etat === 'Disponible' && (
                    <button className="btn btn-success flex-fill" onClick={() => openAssignModal(vehicle._id)}>
                      🚗 Attribuer
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Ajouter/Modifier véhicule */}
      {showAddEditModal && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.6)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editingVehicle ? 'Modifier' : 'Ajouter'} un véhicule</h5>
                <button type="button" className="btn-close" onClick={() => setShowAddEditModal(false)}></button>
              </div>
              <form onSubmit={handleVehicleSubmit}>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-bold">Matricule *</label>
                      <input type="text" className="form-control" value={vehicleForm.matricule} onChange={(e) => setVehicleForm({ ...vehicleForm, matricule: e.target.value })} required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">Année *</label>
                      <input type="number" className="form-control" value={vehicleForm.annee} onChange={(e) => setVehicleForm({ ...vehicleForm, annee: e.target.value })} required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">Marque *</label>
                      <input type="text" className="form-control" value={vehicleForm.marque} onChange={(e) => setVehicleForm({ ...vehicleForm, marque: e.target.value })} required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">Modèle *</label>
                      <input type="text" className="form-control" value={vehicleForm.modele} onChange={(e) => setVehicleForm({ ...vehicleForm, modele: e.target.value })} required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">Type</label>
                      <select className="form-select" value={vehicleForm.type} onChange={(e) => setVehicleForm({ ...vehicleForm, type: e.target.value })}>
                        <option>Voiture</option>
                        <option>Utilitaire</option>
                        <option>Moto</option>
                        <option>Camion</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">Carburant</label>
                      <select className="form-select" value={vehicleForm.carburant} onChange={(e) => setVehicleForm({ ...vehicleForm, carburant: e.target.value })}>
                        <option>Diesel</option>
                        <option>Essence</option>
                        <option>Électrique</option>
                        <option>Hybride</option>
                      </select>
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-bold">Notes</label>
                      <textarea className="form-control" rows="3" value={vehicleForm.notes} onChange={(e) => setVehicleForm({ ...vehicleForm, notes: e.target.value })} />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowAddEditModal(false)}>Annuler</button>
                  <button type="submit" className="btn btn-success">{editingVehicle ? 'Mettre à jour' : 'Ajouter'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Attribution depuis une carte véhicule */}
      {showAssignModal && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.6)' }} tabIndex="-1">
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-success text-white">
                <h5 className="modal-title">
                  Attribuer le véhicule {vehicles.find(v => v._id === assignForm.vehicle)?.matricule || 'Chargement...'}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowAssignModal(false)}></button>
              </div>
              <form onSubmit={handleAssignSubmit}>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-bold">Type d'attribution</label>
                      <select name="type" className="form-select" value={assignForm.type} onChange={handleAssignChange}>
                        <option value="individuelle">👤 Individuelle</option>
                        <option value="partagée">👥 Covoiturage</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">Date de début *</label>
                      <input type="date" name="dateDebut" className="form-control" value={assignForm.dateDebut} onChange={handleAssignChange} required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">Date de fin</label>
                      <input type="date" name="dateFin" className="form-control" value={assignForm.dateFin} onChange={handleAssignChange} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">Direction</label>
                      <input type="text" name="direction" className="form-control" value={assignForm.direction} onChange={handleAssignChange} placeholder="Ex: Rabat → Casablanca" />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-bold">
                        Auditeur(s) * {assignForm.type === 'partagée' && '(minimum 2)'}
                      </label>
                      <select multiple name="users" className="form-select" size="6" onChange={handleAssignChange} required>
                        {allUsers.map(user => (
                          <option key={user._id} value={user._id}>
                            {user.name} ({user.email})
                          </option>
                        ))}
                      </select>
                      <small className="text-muted">Maintenez Ctrl/Cmd pour sélection multiple</small>
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-bold">Notes</label>
                      <textarea name="notes" className="form-control" rows="3" value={assignForm.notes} onChange={handleAssignChange} />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowAssignModal(false)}>Annuler</button>
                  <button type="submit" className="btn btn-success btn-lg px-5">Attribuer</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Attribution globale */}
      {showGlobalAssignModal && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.6)' }} tabIndex="-1">
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-info text-white">
                <h5 className="modal-title">🔄 Attribution manuelle d'un véhicule</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowGlobalAssignModal(false)}></button>
              </div>
              <form onSubmit={handleAssignSubmit}>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label fw-bold">Véhicule disponible *</label>
                      <select name="vehicle" className="form-select form-select-lg" value={assignForm.vehicle} onChange={handleAssignChange} required>
                        <option value="">Choisissez un véhicule disponible</option>
                        {vehicles
                          .filter(v => v.etat === 'Disponible')
                          .map(v => (
                            <option key={v._id} value={v._id}>
                              {v.matricule} - {v.marque} {v.modele} ({v.type} • {v.carburant})
                            </option>
                          ))}
                      </select>
                    </div>
                    {/* Le reste du formulaire est identique à celui de showAssignModal */}
                    {/* Tu peux copier-coller le contenu du modal précédent ici */}
                    <div className="col-md-6">
                      <label className="form-label fw-bold">Type d'attribution</label>
                      <select name="type" className="form-select" value={assignForm.type} onChange={handleAssignChange}>
                        <option value="individuelle">👤 Individuelle</option>
                        <option value="partagée">👥 Covoiturage</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">Date de début *</label>
                      <input type="date" name="dateDebut" className="form-control" value={assignForm.dateDebut} onChange={handleAssignChange} required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">Date de fin</label>
                      <input type="date" name="dateFin" className="form-control" value={assignForm.dateFin} onChange={handleAssignChange} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">Direction</label>
                      <input type="text" name="direction" className="form-control" value={assignForm.direction} onChange={handleAssignChange} placeholder="Ex: Rabat → Casablanca" />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-bold">
                        Auditeur(s) * {assignForm.type === 'partagée' && '(minimum 2)'}
                      </label>
                      <select multiple name="users" className="form-select" size="6" onChange={handleAssignChange} required>
                        {allUsers.map(user => (
                          <option key={user._id} value={user._id}>
                            {user.name} ({user.email})
                          </option>
                        ))}
                      </select>
                      <small className="text-muted">Maintenez Ctrl/Cmd pour sélection multiple</small>
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-bold">Notes</label>
                      <textarea name="notes" className="form-control" rows="3" value={assignForm.notes} onChange={handleAssignChange} />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowGlobalAssignModal(false)}>Annuler</button>
                  <button type="submit" className="btn btn-success btn-lg px-5">Attribuer</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleList;