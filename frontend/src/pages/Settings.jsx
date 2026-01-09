// src/pages/Settings.jsx - Page Paramètres avancée (Admin uniquement) – Tout en français clair
import { useState, useEffect, useContext } from 'react';
import { toast } from 'react-toastify';
import { AuthContext } from '../context/AuthContext';

const Settings = () => {
  const { user } = useContext(AuthContext);

  const [settings, setSettings] = useState({
    weightSeniority: 50,       // Poids ancienneté
    weightEquity: 30,          // Poids équité
    weightCompatibility: 20,   // Poids compatibilité
    autoAcceptDelay: 24        // Délai auto-accept en heures
  });

  const [loading, setLoading] = useState(true);

  // Chargement des paramètres depuis localStorage
  useEffect(() => {
    const loadSettings = () => {
      const saved = localStorage.getItem('intellitask_settings');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setSettings(parsed);
        } catch (e) {
          console.error('Erreur lors de la lecture des paramètres', e);
        }
      }
      setLoading(false);
    };
    loadSettings();
  }, []);

  // Gestion du changement des valeurs
  const handleChange = (e) => {
    const { name, value } = e.target;
    const numValue = name === 'autoAcceptDelay' 
      ? Math.max(1, Math.min(72, Number(value))) 
      : Number(value);

    setSettings(prev => ({
      ...prev,
      [name]: numValue
    }));
  };

  // Calcul du total des 3 poids (doit être exactement 100)
  const totalWeight = settings.weightSeniority + settings.weightEquity + settings.weightCompatibility;

  // Sauvegarde des paramètres
  const handleSave = () => {
    if (totalWeight !== 100) {
      toast.error('Les trois poids doivent totaliser exactement 100%');
      return;
    }

    localStorage.setItem('intellitask_settings', JSON.stringify(settings));
    toast.success('Paramètres sauvegardés avec succès !');

    // À l'avenir, tu pourras ajouter une vraie requête API ici :
    // await API.patch('/admin/settings', settings);
  };

  // Protection : accès réservé aux admins et superAdmins
  if (!user || !['admin', 'superAdmin'].includes(user.role)) {
    return (
      <div className="container py-5 text-center">
        <div className="alert alert-danger">
          <h4>🚫 Accès refusé</h4>
          <p>Seuls les administrateurs peuvent accéder à cette page de paramètres.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Chargement en cours...</span>
        </div>
        <p className="mt-3">Chargement des paramètres...</p>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-9">
          <div className="card shadow-lg border-0">
            <div className="card-header bg-primary text-white text-center py-4">
              <h2 className="mb-0 fw-bold">
                ⚙️ Paramètres d'Assignation Intelligente
              </h2>
              <small className="opacity-90">
                Réservé aux administrateurs
              </small>
            </div>

            <div className="card-body p-5">
              {/* Alerte importante */}
              <div className="alert alert-info">
                <strong>Note importante :</strong> Les trois poids doivent totaliser <strong>exactement 100%</strong> pour que l'algorithme fonctionne correctement.
                <br />
                <strong className={totalWeight === 100 ? 'text-success' : 'text-danger'}>
                  Total actuel : {totalWeight}%
                </strong>
              </div>

              {/* Poids Ancienneté */}
              <div className="mb-5">
                <label className="form-label fw-bold fs-5">
                  🔹 Poids Ancienneté ({settings.weightSeniority}%)
                </label>
                <input
                  type="range"
                  name="weightSeniority"
                  className="form-range"
                  min="0"
                  max="100"
                  step="5"
                  value={settings.weightSeniority}
                  onChange={handleChange}
                />
                <small className="text-muted">
                  Donne la priorité aux auditeurs ayant le plus d'ancienneté dans l'institution.
                </small>
              </div>

              {/* Poids Équité */}
              <div className="mb-5">
                <label className="form-label fw-bold fs-5">
                  ⚖️ Poids Équité ({settings.weightEquity}%)
                </label>
                <input
                  type="range"
                  name="weightEquity"
                  className="form-range"
                  min="0"
                  max="100"
                  step="5"
                  value={settings.weightEquity}
                  onChange={handleChange}
                />
                <small className="text-muted">
                  Assure une répartition équilibrée des tâches pour éviter la surcharge de certains auditeurs.
                </small>
              </div>

              {/* Poids Compatibilité */}
              <div className="mb-5">
                <label className="form-label fw-bold fs-5">
                  🎯 Poids Compatibilité ({settings.weightCompatibility}%)
                </label>
                <input
                  type="range"
                  name="weightCompatibility"
                  className="form-range"
                  min="0"
                  max="100"
                  step="5"
                  value={settings.weightCompatibility}
                  onChange={handleChange}
                />
                <small className="text-muted">
                  Favorise l'attribution selon la spécialité et le grade de l'auditeur.
                </small>
              </div>

              <hr className="my-5" />

              {/* Délai d'acceptation automatique */}
              <div className="mb-5">
                <label className="form-label fw-bold fs-5">
                  ⏱️ Délai avant acceptation automatique ({settings.autoAcceptDelay} heures)
                </label>
                <input
                  type="number"
                  name="autoAcceptDelay"
                  className="form-control form-control-lg text-center"
                  min="1"
                  max="72"
                  value={settings.autoAcceptDelay}
                  onChange={handleChange}
                />
                <small className="text-muted">
                  Si l'auditeur ne répond pas dans ce délai, la tâche lui est automatiquement acceptée.
                </small>
              </div>

              {/* Bouton de sauvegarde */}
              <div className="text-center mt-5">
                <button
                  onClick={handleSave}
                  disabled={totalWeight !== 100}
                  className={`btn btn-lg px-8 py-3 fw-bold rounded-pill shadow-lg ${
                    totalWeight === 100 
                      ? 'btn-primary' 
                      : 'btn-secondary opacity-50 cursor-not-allowed'
                  }`}
                >
                  💾 Sauvegarder les paramètres
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;