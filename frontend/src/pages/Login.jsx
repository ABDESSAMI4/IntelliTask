// src/pages/Login.jsx - Traduction FR/EN + adaptation mobile améliorée
import { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import background from '../assets/background.jpg';
import logo from '../assets/Log.jpg';
import ParticlesBackground from '../components/ParticlesBackground';

const Login = () => {
  const { t, i18n } = useTranslation();
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

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

  // Force le re-render quand la langue change
  const [, setTick] = useState(0);
  useEffect(() => {
    const handleChange = () => setTick(tick => tick + 1);
    i18n.on('languageChanged', handleChange);
    return () => i18n.off('languageChanged', handleChange);
  }, [i18n]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      toast.error(t('email_password_required'));
      return;
    }
    if (!isLogin && !formData.name.trim()) {
      toast.error(t('name_required'));
      return;
    }

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const res = await API.post(endpoint, formData);

      toast.success(isLogin ? t('login_success') : t('registration_success'));
      login(res.data.token);

      if (res.data.role === 'superAdmin' || res.data.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
      setShowModal(false);
    } catch (err) {
      const msg = err.response?.data?.message || t('connection_error');
      toast.error(msg);
    }
  };

  return (
    <>
      {/* LANDING PAGE */}
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

        {/* Particules */}
        <ParticlesBackground />

        {/* Header : Logo + Titre + Langue + Se connecter (responsive) */}
        <div className="position-absolute top-0 start-0 end-0 d-flex justify-content-between align-items-center px-3 px-md-5 py-3" style={{ zIndex: 10 }}>
          {/* Logo + Titre à gauche */}
          <div className="d-flex align-items-center">
            <img
              src={logo}
              alt="IntelliTask Logo"
              className="me-2 me-md-3 shadow rounded-circle img-fluid"
              style={{ width: '50px', height: '50px', maxWidth: '60px' }} // Taille adaptée mobile
            />
            <div>
              <h2 className="text-white fw-bold mb-0 fs-4 fs-md-3">IntelliTask</h2>
              <small className="text-white opacity-75 d-none d-sm-inline">{t('intelligent_management')}</small>
            </div>
          </div>

          {/* Boutons langue + Se connecter à droite */}
          <div className="d-flex align-items-center gap-2 gap-md-3">
            {/* Boutons langue */}
            <div className="d-flex gap-1">
              <button
                onClick={() => changeLanguage('en')}
                className={`btn btn-outline-light btn-sm shadow-sm rounded-pill px-3 fw-bold ${
                  i18n.language === 'en' ? 'bg-white text-primary' : ''
                }`}
              >
                EN
              </button>
              <button
                onClick={() => changeLanguage('fr')}
                className={`btn btn-outline-light btn-sm shadow-sm rounded-pill px-3 fw-bold ${
                  i18n.language === 'fr' ? 'bg-white text-primary' : ''
                }`}
              >
                FR
              </button>
            </div>

            {/* Bouton Se connecter */}
            <button
              onClick={() => setShowModal(true)}
              className="btn btn-outline-light btn-sm shadow-sm px-4 fw-bold rounded-pill"
            >
              {t('sign_in')}
            </button>
          </div>
        </div>

        {/* Contenu centré */}
        <div className="text-center text-white position-relative" style={{ zIndex: 2 }}>
          <h1 className="display-4 display-md-2 fw-bold mb-3 mb-md-4">IntelliTask</h1>
          <p className="fs-4 fs-md-3 opacity-90 mb-4 mb-md-5">
            {t('future_task_management')}
          </p>

          <div className="d-flex flex-column flex-md-row justify-content-center gap-3 gap-md-4">
            <button
              onClick={() => setShowSolutions(!showSolutions)}
              className="btn btn-info btn-lg px-5 rounded-pill shadow-lg fw-bold text-white"
            >
              {t('our_solutions')} →
            </button>
            <button
              onClick={() => setShowContact(!showContact)}
              className="btn btn-outline-light btn-lg px-5 rounded-pill shadow-lg fw-bold"
            >
              {t('contact_us')} →
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
                  {t('solutions_morocco')}
                </h2>
                <p className="lead text-dark mb-4">
                  {t('moroccan_platform_desc')}
                </p>
                <p className="text-dark mb-5">
                  {t('deployed_cities_desc')}
                </p>
                <p className="text-primary fw-bold fs-4">
                  {t('users_trust')}
                </p>
              </div>
              <div className="col-lg-6 text-center">
                <div className="bg-light rounded-4 p-5 shadow-lg">
                  <h3 className="text-primary fw-bold mb-4">{t('deployment_morocco')}</h3>
                  <p className="fs-5 text-primary mb-4 fw-bold">
                    Rabat • Casablanca • Ouarzazate • Errachidia • Agadir • Tanger
                  </p>
                  <div className="bg-white rounded-3 p-4 shadow">
                    <img
                      src="https://images.unsplash.com/photo-1521295121783-8a321d551ad2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
                      alt={t('morocco_map')}
                      className="img-fluid rounded shadow"
                    />
                    <p className="mt-3 text-muted small">
                      {t('deployed_north_south')}
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
                <h5 className="fw-bold mb-4">{t('contact')}</h5>
                <p className="mb-2">📞 +212 (0) 6 24 04 60 76</p>
                <p>✉️ a.aglagal@edu.ac.ma</p>
              </div>
              <div className="col-md-4">
                <h5 className="fw-bold mb-4">{t('careers')}</h5>
                <p>{t('join_team')}</p>
                <p>{t('welcome_dev_design')}</p>
              </div>
              <div className="col-md-4">
                <h5 className="fw-bold mb-4">{t('follow_us')}</h5>
              <div className="d-flex justify-content-center justify-content-md-start gap-4 fs-3">
  <button className="btn btn-link text-white fs-3 p-0">Facebook</button>
  <button className="btn btn-link text-white fs-3 p-0">Instagram</button>
  <button className="btn btn-link text-white fs-3 p-0">Twitter</button>
  <button className="btn btn-link text-white fs-3 p-0">LinkedIn</button>
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
          <div className="bg-white rounded-4 shadow-lg p-4 p-md-5" style={{ maxWidth: '550px', width: '90%' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3 className="fw-bold text-primary mb-0">
                {isLogin ? t('sign_in') : t('sign_up')}
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
                    <label className="form-label fw-bold">{t('full_name')}</label>
                    <input
                      type="text"
                      name="name"
                      className="form-control form-control-lg"
                      placeholder={t('name_placeholder')}
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label className="form-label fw-bold">{t('specialty')}</label>
                      <select
                        name="specialty"
                        className="form-select form-select-lg"
                        value={formData.specialty}
                        onChange={handleChange}
                      >
                        <option value="">{t('choose')}...</option>
                        <option value="informatique">{t('computer_science')}</option>
                        <option value="pedagogique">{t('pedagogy')}</option>
                        <option value="planification">{t('planning')}</option>
                        <option value="financiers">{t('finance')}</option>
                        <option value="orientation">{t('orientation')}</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">{t('grade')}</label>
                      <select
                        name="grade"
                        className="form-select form-select-lg"
                        value={formData.grade}
                        onChange={handleChange}
                      >
                        <option value="">{t('choose')}...</option>
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              <div className="mb-3">
                <label className="form-label fw-bold">{t('email')}</label>
                <input
                  type="email"
                  name="email"
                  className="form-control form-control-lg"
                  placeholder={t('email_placeholder')}
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="mb-4">
                <label className="form-label fw-bold">{t('password')}</label>
                <input
                  type="password"
                  name="password"
                  className="form-control form-control-lg"
                  placeholder={t('password_placeholder')}
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg w-100 shadow rounded-pill mb-3"
              >
                {isLogin ? t('sign_in') : t('create_account')}
              </button>

              {/*<div className="text-center">
                <button
                  type="button"
                  className="btn btn-link text-decoration-none fw-bold"
                  onClick={() => setIsLogin(!isLogin)}
                >
                  {isLogin ? t('no_account') : t('already_account')}
                </button>
              </div>*/}
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Login;