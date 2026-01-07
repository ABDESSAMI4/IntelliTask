// src/pages/RequestVehicle.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { toast } from 'react-toastify';

const RequestVehicle = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    vehicle: '',
    dateDebut: '',
    dateFin: '',
    direction: '',
    notes: ''
  });
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const res = await API.get('/vehicles');
        // On garde seulement les véhicules actuellement disponibles
        const available = res.data.filter(v => v.etat === 'Disponible');
        setVehicles(available);
        if (available.length === 0) {
          toast.info('Aucun véhicule disponible pour le moment.');
        }
      } catch (err) {
        toast.error('Impossible de charger les véhicules');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchVehicles();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });

    if (name === 'vehicle') {
      const veh = vehicles.find(v => v._id === value);
      setSelectedVehicle(veh || null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.vehicle || !form.dateDebut) {
      toast.error('Véhicule et date de début obligatoires');
      return;
    }

    if (form.dateFin && new Date(form.dateFin) < new Date(form.dateDebut)) {
      toast.error('La date de fin doit être après la date de début');
      return;
    }

    try {
      await API.post('/vehicle-requests', {
        vehicle: form.vehicle,
        dateDebut: form.dateDebut,
        dateFin: form.dateFin || null,
        direction: form.direction,
        notes: form.notes
      });

      toast.success('✅ Demande envoyée ! L’administrateur va la traiter bientôt.');

      // Reset
      setForm({ vehicle: '', dateDebut: '', dateFin: '', direction: '', notes: '' });
      setSelectedVehicle(null);

      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err) {
      const msg = err.response?.data?.message || 'Erreur lors de l’envoi';
      toast.error(msg);
    }
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
        <p className="mt-3">Chargement des véhicules...</p>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-8 col-xl-6">
          <div className="text-center mb-5">
            <h1 className="display-5 fw-bold text-primary mb-3">🚗 Demander un véhicule</h1>
            <p className="lead text-muted">
              Sélectionnez un véhicule disponible et indiquez les dates souhaitées.
            </p>
          </div>

          <div className="card shadow-lg border-0">
            <div className="card-body p-5">
              <form onSubmit={handleSubmit}>
                {/* Véhicule */}
                <div className="mb-4">
                  <label className="form-label fw-bold fs-5">
                    Véhicule disponible <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select form-select-lg"
                    name="vehicle"
                    value={form.vehicle}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Choisissez un véhicule</option>
                    {vehicles.map(v => (
                      <option key={v._id} value={v._id}>
                        {v.matricule} - {v.marque} {v.modele} ({v.type} • {v.carburant})
                      </option>
                    ))}
                  </select>

                  {selectedVehicle && (
                    <div className="mt-2 p-3 bg-light rounded">
                      <strong>{selectedVehicle.matricule}</strong> - {selectedVehicle.marque} {selectedVehicle.modele}
                    </div>
                  )}
                </div>

                {/* Dates */}
                <div className="row mb-4">
                  <div className="col-md-6">
                    <label className="form-label fw-bold">
                      Date de début <span className="text-danger">*</span>
                    </label>
                    <input
                      type="date"
                      className="form-control form-control-lg"
                      name="dateDebut"
                      value={form.dateDebut}
                      onChange={handleChange}
                      min={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold">Date de fin (optionnel)</label>
                    <input
                      type="date"
                      className="form-control form-control-lg"
                      name="dateFin"
                      value={form.dateFin}
                      onChange={handleChange}
                      min={form.dateDebut || new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>

                {/* Direction */}
                <div className="mb-4">
                  <label className="form-label fw-bold">Direction / Destination</label>
                  <input
                    type="text"
                    className="form-control form-control-lg"
                    name="direction"
                    placeholder="Ex: Rabat, Casablanca..."
                    value={form.direction}
                    onChange={handleChange}
                  />
                </div>

                {/* Notes */}
                <div className="mb-5">
                  <label className="form-label fw-bold">Justification de la demande</label>
                  <textarea
                    className="form-control"
                    rows="4"
                    name="notes"
                    placeholder="Expliquez le motif de votre demande..."
                    value={form.notes}
                    onChange={handleChange}
                  />
                </div>

                <div className="d-flex gap-3 justify-content-center">
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-lg px-5"
                    onClick={() => navigate('/dashboard')}
                  >
                    Retour
                  </button>
                  <button
                    type="submit"
                    className="btn btn-success btn-lg px-5 shadow"
                    disabled={!form.vehicle || !form.dateDebut}
                  >
                    Envoyer la demande
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestVehicle;