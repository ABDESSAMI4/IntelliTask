// src/pages/Register.jsx
import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    specialty: '',
    grade: ''
  });

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation simple
    if (!formData.name || !formData.email || !formData.password) {
      toast.error('Tous les champs obligatoires doivent être remplis');
      return;
    }

    try {
      const res = await API.post('/auth/register', formData);

      toast.success('Inscription réussie ! Bienvenue !');
      login(res.data.token);

      // Redirection selon rôle
      if (res.data.role === 'superAdmin' || res.data.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Erreur lors de l\'inscription';
      toast.error(msg);
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-5">
          <div className="card shadow-lg border-0">
            <div className="card-header bg-success text-white text-center py-4">
              <h3 className="mb-0">Inscription - TaskMe</h3>
            </div>
            <div className="card-body p-5">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label fw-bold">Nom complet</label>
                  <input
                    type="text"
                    name="name"
                    className="form-control form-control-lg"
                    placeholder="Ex: Ahmed Benali"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-bold">Email</label>
                  <input
                    type="email"
                    name="email"
                    className="form-control form-control-lg"
                    placeholder="exemple@taskme.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-bold">Mot de passe</label>
                  <input
                    type="password"
                    name="password"
                    className="form-control form-control-lg"
                    placeholder="Minimum 6 caractères"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-bold">Spécialité</label>
                  <select
                    name="specialty"
                    className="form-select form-select-lg"
                    value={formData.specialty}
                    onChange={handleChange}
                  >
                    <option value="">Choisir une spécialité...</option>
                    <option value="informatique">Informatique</option>
                    <option value="pedagogique">Pédagogique</option>
                    <option value="planification">Planification</option>
                    <option value="financiers">Financiers</option>
                    <option value="orientation">Orientation</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="form-label fw-bold">Grade</label>
                  <select
                    name="grade"
                    className="form-select form-select-lg"
                    value={formData.grade}
                    onChange={handleChange}
                  >
                    <option value="">Choisir un grade...</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                  </select>
                </div>

                <button type="submit" className="btn btn-success btn-lg w-100 mb-3">
                  Créer mon compte
                </button>

                <div className="text-center">
                  <a href="/login" className="btn btn-link">
                    Déjà un compte ? Se connecter
                  </a>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;