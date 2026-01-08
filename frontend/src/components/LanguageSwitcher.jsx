// src/components/LanguageSwitcher.jsx
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('i18nextLng', lng); // Sauvegarde le choix
  };

  return (
    <div className="d-flex gap-3 align-items-center">
      <button
        onClick={() => changeLanguage('fr')}
        className={`btn btn-sm ${i18n.language === 'fr' ? 'btn-primary' : 'btn-outline-primary'}`}
      >
        FR
      </button>
      <button
        onClick={() => changeLanguage('en')}
        className={`btn btn-sm ${i18n.language === 'en' ? 'btn-primary' : 'btn-outline-primary'}`}
      >
        EN
      </button>
    </div>
  );
};

export default LanguageSwitcher;