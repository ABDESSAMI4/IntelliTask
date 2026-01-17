// src/pages/TaskCreate.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import API from '../services/api';

const TaskCreate = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'Formateur',
    startDate: '',
    endDate: '',
    places: 1,
    remunerated: false,
    remunerationAmount: 0,
    specialties: [],
    grades: [],
    needsVehicle: false,
    direction: '',
    isCommon: false,
    adminFile: null  // ← Pour le fichier PDF (base64)
  });

  const specialtiesOptions = ['informatique', 'pedagogique', 'planification', 'financiers', 'orientation'];
  const gradesOptions = ['A', 'B', 'C'];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleArrayChange = (e) => {
    const { name, options } = e.target;
    const selected = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selected.push(options[i].value);
      }
    }
    setFormData(prev => ({ ...prev, [name]: selected }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('Seuls les fichiers PDF sont autorisés');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, adminFile: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await API.post('/tasks', formData);
      toast.success('Tâche créée avec succès !');
      navigate('/admin/tasks');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la création');
      setLoading(false);
    }
  };

  return (
    <div className="container py-5">
      <h2 className="text-center mb-5 text-primary fw-bold">Créer une Nouvelle Tâche</h2>

      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="card shadow-lg">
            <div className="card-body p-5">
              <form onSubmit={handleSubmit}>
                <div className="row mb-4">
                  <div className="col-md-8">
                    <label className="form-label fw-bold">Nom de la tâche *</label>
                    <input
                      type="text"
                      name="name"
                      className="form-control form-control-lg"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-bold">Type</label>
                    <select name="type" className="form-select form-select-lg" value={formData.type} onChange={handleChange}>
                      <option>Formateur</option>
                      <option>Jury</option>
                      <option>Logisticien</option>
                    </select>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="form-label fw-bold">Description *</label>
                  <textarea
                    name="description"
                    className="form-control"
                    rows="4"
                    value={formData.description}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="row mb-4">
                  <div className="col-md-6">
                    <label className="form-label fw-bold">Date de début</label>
                    <input
                      type="date"
                      name="startDate"
                      className="form-control form-control-lg"
                      value={formData.startDate}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold">Date de fin *</label>
                    <input
                      type="date"
                      name="endDate"
                      className="form-control form-control-lg"
                      value={formData.endDate}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="row mb-4">
                  <div className="col-md-4">
                    <label className="form-label fw-bold">Nombre de places *</label>
                    <input
                      type="number"
                      name="places"
                      className="form-control form-control-lg"
                      min="1"
                      value={formData.places}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-bold">Rémunérée</label>
                    <div className="form-check form-switch mt-4">
                      <input
                        type="checkbox"
                        name="remunerated"
                        className="form-check-input"
                        checked={formData.remunerated}
                        onChange={handleChange}
                      />
                      <label className="form-check-label">Oui</label>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-bold">Montant rémunération (DH)</label>
                    <input
                      type="number"
                      name="remunerationAmount"
                      className="form-control form-control-lg"
                      min="0"
                      value={formData.remunerationAmount}
                      onChange={handleChange}
                      disabled={!formData.remunerated}
                    />
                  </div>
                </div>

                <div className="row mb-4">
                  <div className="col-md-6">
                    <label className="form-label fw-bold">Spécialités requises</label>
                    <select
                      name="specialties"
                      className="form-select form-select-lg"
                      multiple
                      size="5"
                      value={formData.specialties}
                      onChange={handleArrayChange}
                    >
                      {specialtiesOptions.map(s => (
                        <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                      ))}
                    </select>
                    <small className="text-muted">Ctrl + clic pour sélectionner plusieurs</small>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold">Grades requis</label>
                    <select
                      name="grades"
                      className="form-select form-select-lg"
                      multiple
                      value={formData.grades}
                      onChange={handleArrayChange}
                    >
                      {gradesOptions.map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="row mb-4">
                  <div className="col-md-6">
                    <label className="form-label fw-bold">Besoin de véhicule</label>
                    <div className="form-check form-switch mt-4">
                      <input
                        type="checkbox"
                        name="needsVehicle"
                        className="form-check-input"
                        checked={formData.needsVehicle}
                        onChange={handleChange}
                      />
                      <label className="form-check-label">Oui</label>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold">Direction / Ville</label>
                    <input
                      type="text"
                      name="direction"
                      className="form-control form-control-lg"
                      placeholder="Ex: Casablanca"
                      value={formData.direction}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* AJOUT INPUT PDF */}
                <div className="mb-4">
                  <label className="form-label fw-bold">Fichier PDF (guide administratif)</label>
                  <input
                    type="file"
                    className="form-control form-control-lg"
                    accept=".pdf"
                    onChange={handleFileChange}
                  />
                  <small className="text-muted">Optionnel – guide ou document pour les assignés</small>
                </div>

                <div className="text-center">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-success btn-lg px-5"
                  >
                    {loading ? 'Création en cours...' : 'Créer la tâche'}
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

export default TaskCreate;