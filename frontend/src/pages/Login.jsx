// src/pages/Login.jsx - Version finale professionnelle avec NetworkGraph
import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';

// Assets
import background from '../assets/background.jpg';
import logo from '../assets/Log.jpg';

// Graph animé de nœuds connectés
import NetworkGraph from '../components/NetworkGraph';



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
      toast.error('Email et mot de passe sont obligatoires');
      return;
    }

    if (!isLogin && !formData.name) {
      toast.error('Le nom est obligatoire pour l\'inscription');
      return;
    }

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const res = await API.post(endpoint, formData);

      toast.success(isLogin ? 'Connexion réussie ! Bienvenue 👋' : 'Compte créé avec succès !');

      if (res.data.token) {
        login(res.data.token, res.data.user);
      }

      // Redirection selon rôle
      if (res.data.role === 'superAdmin' || res.data.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }

      setShowModal(false);
    } catch (err) {
      const msg = err.response?.data?.message || 'Erreur lors de la connexion';
      toast.error(msg);
    }
  };

  return (
    <>
      {/* LANDING PAGE – Fond ville + Graph animé de nœuds connectés */}
      <div
        className="position-relative d-flex align-items-center justify-content-center min-vh-100 overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.7)), url(${background})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        {/* GRAPHE DE NŒUDS CONNECTÉS – UNIQUEMENT SUR CETTE SECTION */}
        <NetworkGraph />

        {/* Logo + Titre en haut gauche */}
        <div className="position-absolute top-0 start-0 p-4 p-lg-5" style={{ zIndex: 10 }}>
          <div className="d-flex align-items-center">
            <img
              src={logo}
              alt="IntelliTask"
              className="rounded-circle shadow-lg border border-4 border-white me-3"
              style={{ width: '80px', height: '80px', objectFit: 'cover' }}
            />
            <div>
              <h2 className="text-white fw-bold mb-0">IntelliTask</h2>
              <p className="text-white opacity-75 mb-0 small">Gestion intelligente</p>
            </div>
          </div>
        </div>

        {/* Bouton Connexion en haut droite */}
        <div className="position-absolute top-0 end-0 p-4 p-lg-5" style={{ zIndex: 10 }}>
          <button
            onClick={() => setShowModal(true)}
            className="btn btn-outline-light btn-lg px-5 py-3 rounded-pill shadow-lg fw-bold border-3 transition-all hover-bg-white hover-text-primary"
          >
            Se connecter
          </button>
        </div>

        {/* Contenu centré */}
        <div className="text-center text-white px-4" style={{ zIndex: 2 }}>
          <h1 className="display-3 display-lg-1 fw-bold mb-4 text-shadow">
            IntelliTask
          </h1>
          <p className="fs-2 fs-lg-1 mb-5 opacity-90 text-shadow">
            Le futur de la gestion des tâches à portée de main !
          </p>

          <div className="d-flex flex-column flex-md-row gap-4 justify-content-center">
            <button
              onClick={() => setShowSolutions(!showSolutions)}
              className="btn btn-info btn-lg px-5 py-3 rounded-pill shadow-lg fw-bold transition-all hover-shadow"
            >
              Nos solutions →
            </button>
            <button
              onClick={() => setShowContact(!showContact)}
              className="btn btn-outline-light btn-lg px-5 py-3 rounded-pill shadow-lg fw-bold transition-all hover-bg-white hover-text-primary"
            >
              Nous contacter →
            </button>
          </div>
        </div>
      </div>

      {/* SECTION NOS SOLUTIONS – SANS GRAPH */}
      {showSolutions && (
        <section className="py-5 bg-white">
          <div className="container py-5">
            <div className="row align-items-center g-5">
              <div className="col-lg-6">
                <h2 className="display-5 fw-bold text-primary mb-4">
                  Nos solutions à travers le monde
                </h2>
                <p className="lead text-dark mb-4">
                  IntelliTask est une plateforme intelligente conçue pour les équipes modernes. 
                  Nous aidons les entreprises, institutions et équipes à organiser, assigner et suivre les tâches avec une IA intégrée.
                </p>
                <p className="text-dark mb-5">
                  Présente dans plusieurs pays, notre solution offre : assignation automatique IA, notifications en temps réel, 
                  historique complet, export PDF/Excel, et tableaux de bord analytiques.
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
                      alt="Carte du Maroc avec villes IntelliTask"
                      className="img-fluid rounded shadow"
                    />
                    <p className="mt-3 text-muted small">
                      IntelliTask est déployé dans les principales villes du Royaume pour une gestion optimisée des tâches administratives et éducatives.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SECTION CONTACT – SANS GRAPH */}
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
          className="position-fixed inset-0 d-flex align-items-center justify-content-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 1050 }}
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-4 shadow-2xl p-5"
            style={{ maxWidth: '520px', width: '95%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3 className="fw-bold text-primary mb-0">
                {isLogin ? 'Connexion' : 'Créer un compte'}
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
                  <div className="mb-4">
                    <label className="form-label fw-bold">Nom complet</label>
                    <input
                      type="text"
                      name="name"
                      className="form-control form-control-lg rounded-pill"
                      placeholder="Ex: Ahmed Benali"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="row g-3 mb-4">
                    <div className="col-md-6">
                      <label className="form-label fw-bold">Spécialité</label>
                      <select
                        name="specialty"
                        className="form-select form-select-lg rounded-pill"
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
                        className="form-select form-select-lg rounded-pill"
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

              <div className="mb-4">
                <label className="form-label fw-bold">Email institutionnel</label>
                <input
                  type="email"
                  name="email"
                  className="form-control form-control-lg rounded-pill"
                  placeholder="nom@edu.ac.ma"
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
                  className="form-control form-control-lg rounded-pill"
                  placeholder="Minimum 6 caractères"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg w-100 rounded-pill shadow-lg fw-bold py-3 mb-3 transition-all hover-shadow"
              >
                {isLogin ? 'Se connecter' : 'Créer mon compte'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  className="btn btn-link text-primary fw-bold"
                  onClick={() => setIsLogin(!isLogin)}
                >
                  {isLogin ? 'Pas de compte ? S\'inscrire' : 'Déjà inscrit ? Se connecter'}
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