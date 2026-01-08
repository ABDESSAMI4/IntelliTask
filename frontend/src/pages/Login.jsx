// src/pages/Login.jsx
import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import background from '../assets/background.jpg'; // Image de ville
import logo from '../assets/Log.jpg'; // Ton logo
import ParticlesBackground from '../components/ParticlesBackground';

const Login = () => {
  const [showModal, setShowModal] = useState(false);
  const [showSolutions, setShowSolutions] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
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

    if (!formData.email || !formData.password) {
      toast.error('Email et mot de passe obligatoires');
      return;
    }
    if (!isLogin && !formData.name) {
      toast.error('Nom obligatoire pour l\'inscription');
      return;
    }

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const res = await API.post(endpoint, formData);

      toast.success(isLogin ? 'Connexion réussie ! Bienvenue !' : 'Inscription réussie !');
      login(res.data.token);

      if (res.data.role === 'superAdmin' || res.data.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
      setShowModal(false);
    } catch (err) {
      const msg = err.response?.data?.message || 'Erreur de connexion';
      toast.error(msg);
    }
  };

  return (
    <>
      {/* LANDING PAGE - Fond ville + particules */}
      <div
        className="position-relative d-flex align-items-center justify-content-center overflow-hidden"
        style={{
          backgroundImage: `url(${background})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          minHeight: '100vh',
          width: '100vw'
        }}
      >
        {/* Overlay sombre */}
        <div
          className="position-absolute top-0 start-0 w-100 h-100"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1 }}
        />

        {/* Animation particules nœuds/lignes */}
        <ParticlesBackground />

        {/* Logo + Titre en haut à gauche */}
        <div className="position-absolute top-0 start-0 p-4 p-lg-5" style={{ zIndex: 10 }}>
          <div className="d-flex align-items-center">
            <img
              src={logo}
              alt="IntelliTask Logo"
              className="me-3 shadow-lg rounded-circle"
              style={{ width: '80px', height: '80px', objectFit: 'cover' }}
            />
            <div>
              <h2 className="text-white fw-bold mb-0">IntelliTask</h2>
              <small className="text-white opacity-75">Gestion intelligente</small>
            </div>
          </div>
        </div>

        {/* Bouton "Se connecter" en haut à droite */}
        <div className="position-absolute top-0 end-0 p-4 p-lg-5" style={{ zIndex: 10 }}>
          <button
            onClick={() => setShowModal(true)}
            className="btn btn-outline-light btn-lg shadow-lg px-5 fw-bold rounded-pill border-2"
          >
            Se connecter
          </button>
        </div>

        {/* Titre + slogan + boutons centré */}
        <div className="text-center text-white position-relative" style={{ zIndex: 2 }}>
          <h1 className="display-2 display-md-1 fw-bold mb-4">IntelliTask</h1>
          <p className="fs-3 fs-md-2 opacity-90 mb-5">
            Le futur de la gestion des tâches à portée de main !
          </p>

          <div className="d-flex flex-column flex-md-row justify-content-center gap-4">
            <button
              onClick={() => setShowSolutions(!showSolutions)}
              className="btn btn-info btn-lg px-5 rounded-pill shadow-lg fw-bold text-white"
            >
              Nos solutions →
            </button>
            <button
              onClick={() => setShowContact(!showContact)}
              className="btn btn-outline-light btn-lg px-5 rounded-pill shadow-lg fw-bold"
            >
              Nous contacter →
            </button>
          </div>
        </div>
      </div>

   {/* SECTION NOS SOLUTIONS */}
      {showSolutions && (
        <section className="py-5 bg-white">
          <div className="container py-5">
            <div className="row align-items-center g-5">
              <div className="col-lg-6">
                <h2 className="display-5 fw-bold text-primary mb-4">
                  Nos solutions à travers le Maroc
                </h2>
                <p className="lead text-dark mb-4">
                  IntelliTask est une plateforme intelligente conçue pour les institutions marocaines.
                </p>
                <p className="text-dark mb-5">
                  Déployée dans les principales villes du Royaume, notre solution offre une gestion optimisée des tâches, 
                  assignation automatique par IA, notifications en temps réel et historique complet.
                </p>
                <p className="text-primary fw-bold fs-4">
                  Plus de 100 utilisateurs nous font confiance.
                </p>
              </div>
              <div className="col-lg-6 text-center">
                <div className="bg-light rounded-4 p-5 shadow-lg">
                  <h3 className="text-primary fw-bold mb-4">Déploiement au Maroc</h3>
                  <p className="fs-5 text-primary mb-4 fw-bold">
                    Rabat • Casablanca • Ouarzazate • Errachidia • Agadir • Tanger
                  </p>
                  <div className="bg-white rounded-3 p-4 shadow">
                    <img
                      src="https://images.unsplash.com/photo-1521295121783-8a321d551ad2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
                      alt="Carte complète du Maroc - IntelliTask"
                      className="img-fluid rounded shadow"
                    />
                    <p className="mt-3 text-muted small">
                      IntelliTask est déployé dans tout le Royaume, du Nord au Sud.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

   {/* SECTION CONTACT */}
      {showContact && (
        <footer className="bg-dark text-white py-5">
          <div className="container">
            <div className="row text-center text-md-start g-5">
              <div className="col-md-4">
                <h5 className="fw-bold mb-4">CONTACT</h5>
                <p className="mb-2">📞 +212 (0) 625 37 88 837</p>
                <p>✉️ a.aglagal@edu.ac.ma</p>
              </div>
              <div className="col-md-4">
                <h5 className="fw-bold mb-4">CARRIÈRES</h5>
                <p>Rejoignez une équipe innovante</p>
                <p>Développeurs, designers, passionnés bienvenus</p>
              </div>
              <div className="col-md-4">
                <h5 className="fw-bold mb-4">SUIVEZ-NOUS</h5>
                <div className="d-flex justify-content-center justify-content-md-start gap-4 fs-3">
                  <a href="#" className="text-white transition-all hover-text-info">Facebook</a>
                  <a href="#" className="text-white transition-all hover-text-info">Instagram</a>
                  <a href="#" className="text-white transition-all hover-text-info">Twitter</a>
                  <a href="#" className="text-white transition-all hover-text-info">LinkedIn</a>
                </div>
              </div>
            </div>
            <div className="text-center mt-5">
              <button
                onClick={() => setShowContact(false)}
                className="btn btn-outline-light rounded-circle shadow-lg"
                style={{ width: '60px', height: '60px', fontSize: '24px' }}
              >
                ↑
              </button>
            </div>
          </div>
        </footer>
      )}
      {/* MODAL CONNEXION / INSCRIPTION */}
      {showModal && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)', zIndex: 1000 }}
        >
          <div className="bg-white rounded-4 shadow-lg p-5" style={{ maxWidth: '550px', width: '90%' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3 className="fw-bold text-primary mb-0">
                {isLogin ? 'Connexion' : 'Inscription'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="btn-close"
                aria-label="Fermer"
              />
            </div>

            <form onSubmit={handleSubmit}>
              {!isLogin && (
                <>
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

                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label className="form-label fw-bold">Spécialité</label>
                      <select
                        name="specialty"
                        className="form-select form-select-lg"
                        value={formData.specialty}
                        onChange={handleChange}
                      >
                        <option value="">Choisir...</option>
                        <option value="informatique">Informatique</option>
                        <option value="pedagogique">Pédagogique</option>
                        <option value="planification">Planification</option>
                        <option value="financiers">Financiers</option>
                        <option value="orientation">Orientation</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">Grade</label>
                      <select
                        name="grade"
                        className="form-select form-select-lg"
                        value={formData.grade}
                        onChange={handleChange}
                      >
                        <option value="">Choisir...</option>
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              <div className="mb-3">
                <label className="form-label fw-bold">Email</label>
                <input
                  type="email"
                  name="email"
                  className="form-control form-control-lg"
                  placeholder="exemple@intellitask.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="mb-4">
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

              <button
                type="submit"
                className="btn btn-primary btn-lg w-100 shadow rounded-pill mb-3"
              >
                {isLogin ? 'Se connecter' : 'Créer mon compte'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  className="btn btn-link text-decoration-none fw-bold"
                  onClick={() => setIsLogin(!isLogin)}
                >
                  {isLogin ? 'Pas de compte ? S\'inscrire ici' : 'Déjà inscrit ? Se connecter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Login;