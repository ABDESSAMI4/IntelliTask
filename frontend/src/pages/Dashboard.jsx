import { useTheme } from '../context/ThemeContext';

const Dashboard = () => {
  const { isDarkMode, toggleDarkMode } = useTheme();

  return (
    <div>
      {/* Ton header ou navbar */}
      <div className="d-flex justify-content-between align-items-center p-3 bg-primary text-white">
        <h2>Bienvenue dans IntelliTask</h2>
        <button
          onClick={toggleDarkMode}
          className="btn btn-outline-light rounded-circle p-2"
          style={{ width: '40px', height: '40px' }}
          title="Toggle mode sombre/clair"
        >
          {isDarkMode ? '☀️' : '🌙'}
        </button>
      </div>

      {/* Reste de ton dashboard */}
      {/* ... */}
    </div>
  );
};