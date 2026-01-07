// src/pages/Settings.jsx
import { useState } from 'react';
import { toast } from 'react-toastify';

const Settings = () => {
  const [settings, setSettings] = useState({
    weightSeniority: 50,     // poids ancienneté (0-100)
    weightEquity: 30,        // poids équité rémunérée
    weightCompatibility: 20, // poids compatibilité specialty/grade
    autoAcceptDelay: 24      // heures avant auto-accept
  });

  const handleChange = (e) => {
    setSettings({ ...settings, [e.target.name]: Number(e.target.value) });
  };

  const handleSave = () => {
    // Ici tu peux sauvegarder en localStorage ou API backend
    localStorage.setItem('taskmeSettings', JSON.stringify(settings));
    toast.success('Paramètres sauvegardés !');
  };

  return (
    <div className="container py-5">
      <h2 className="text-center mb-5 text-primary">Paramètres d'Équité et Assignation</h2>
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card shadow">
            <div className="card-body">
              <p className="text-muted mb-4">
                Ajustez les poids pour l'algorithme semi-automatique (total doit faire 100)
              </p>

              <div className="mb-4">
                <label className="form-label">Poids Ancienneté ({settings.weightSeniority}%)</label>
                <input
                  type="range"
                  name="weightSeniority"
                  className="form-range"
                  min="0"
                  max="100"
                  value={settings.weightSeniority}
                  onChange={handleChange}
                />
              </div>

              <div className="mb-4">
                <label className="form-label">Poids Équité Rémunérée ({settings.weightEquity}%)</label>
                <input
                  type="range"
                  name="weightEquity"
                  className="form-range"
                  min="0"
                  max="100"
                  value={settings.weightEquity}
                  onChange={handleChange}
                />
              </div>

              <div className="mb-4">
                <label className="form-label">Poids Compatibilité ({settings.weightCompatibility}%)</label>
                <input
                  type="range"
                  name="weightCompatibility"
                  className="form-range"
                  min="0"
                  max="100"
                  value={settings.weightCompatibility}
                  onChange={handleChange}
                />
              </div>

              <div className="mb-4">
                <label className="form-label">Délai auto-accept (heures)</label>
                <input
                  type="number"
                  name="autoAcceptDelay"
                  className="form-control"
                  min="1"
                  max="72"
                  value={settings.autoAcceptDelay}
                  onChange={handleChange}
                />
              </div>

              <div className="text-center">
                <button onClick={handleSave} className="btn btn-primary btn-lg">
                  Sauvegarder les paramètres
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