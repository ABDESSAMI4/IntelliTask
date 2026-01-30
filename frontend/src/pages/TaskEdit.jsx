// src/pages/TaskEdit.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import API from '../services/api';

const TaskEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

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
    adminFile: null,
    existingFileUrl: ''
  });

  const specialtiesOptions = ['informatique', 'pedagogique', 'planification', 'financiers', 'orientation'];
  const gradesOptions = ['A', 'B', 'C'];

  // Charger la tâche existante
  useEffect(() => {
    const fetchTask = async () => {
      try {
        const res = await API.get(`/tasks/${id}`);
        const task = res.data;
        
        // Formater les dates pour l'input date
        const formatDateForInput = (dateString) => {
          if (!dateString) return '';
          const date = new Date(dateString);
          return date.toISOString().split('T')[0];
        };

        setFormData({
          name: task.name || '',
          description: task.description || '',
          type: task.type || 'Formateur',
          startDate: formatDateForInput(task.startDate),
          endDate: formatDateForInput(task.endDate),
          places: task.places || 1,
          remunerated: task.remunerated || false,
          remunerationAmount: task.remunerationAmount || 0,
          specialties: task.specialties || [],
          grades: task.grades || [],
          needsVehicle: task.needsVehicle || false,
          direction: task.direction || '',
          isCommon: task.isCommon || false,
          adminFile: null,
          existingFileUrl: task.adminFile || task.pdfUrl || ''
        });
        setLoading(false);
      } catch (err) {
        toast.error('Impossible de charger la tâche');
        navigate('/admin/tasks');
      }
    };
    fetchTask();
  }, [id, navigate]);

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
    setUpdating(true);

    try {
      // Préparer les données pour l'envoi
      const updateData = { ...formData };
      
      // Si aucun nouveau fichier n'est uploadé, on retire adminFile
      if (!updateData.adminFile) {
        delete updateData.adminFile;
      }
      
      // Retirer le champ existingFileUrl qui n'est pas nécessaire pour l'API
      delete updateData.existingFileUrl;

      await API.put(`/tasks/${id}`, updateData);
      toast.success('✅ Tâche mise à jour avec succès !');
      navigate('/admin/tasks');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la mise à jour');
      setUpdating(false);
    }
  };

  const handleCancel = () => {
    navigate('/admin/tasks');
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
        <p className="mt-3">Chargement de la tâche...</p>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <h2 className="text-center mb-5 text-primary fw-bold">Modifier la Tâche</h2>

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

                {/* Section Fichier PDF */}
                <div className="mb-4">
                  <label className="form-label fw-bold">Fichier PDF (guide administratif)</label>
                  
                  {/* Afficher le fichier existant s'il y en a un */}
                  {formData.existingFileUrl && (
                    <div className="mb-3">
                      <p className="mb-1">
                        <strong>Fichier actuel :</strong>
                        <a 
                          href={formData.existingFileUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="ms-2"
                        >
                          📄 Voir le PDF actuel
                        </a>
                      </p>
                      <div className="form-check">
                        <input
                          type="checkbox"
                          id="keepExistingFile"
                          className="form-check-input"
                          defaultChecked
                        />
                        <label className="form-check-label" htmlFor="keepExistingFile">
                          Conserver le fichier existant
                        </label>
                      </div>
                    </div>
                  )}
                  
                  <input
                    type="file"
                    className="form-control form-control-lg"
                    accept=".pdf"
                    onChange={handleFileChange}
                  />
                  <small className="text-muted">
                    {formData.existingFileUrl 
                      ? "Laissez vide pour garder le fichier existant, ou sélectionnez un nouveau fichier pour le remplacer" 
                      : "Optionnel – guide ou document pour les assignés"}
                  </small>
                </div>

                <div className="d-flex justify-content-between">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="btn btn-outline-secondary btn-lg px-4"
                  >
                    Annuler
                  </button>
                  
                  <button
                    type="submit"
                    disabled={updating}
                    className="btn btn-warning btn-lg px-5"
                  >
                    {updating ? 'Mise à jour en cours...' : 'Mettre à jour'}
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

export default TaskEdit;