// src/index.js - Version finale complète avec traduction FR/EN
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Tes styles globaux
import App from './App';

// Contexts
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';

// Toast notifications
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// === TRADUCTION : Initialisation i18next ===
import './i18n'; // ← Ce fichier initialise i18next (FR/EN)

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render( <
    React.StrictMode >
    <
    ThemeProvider >
    <
    AuthProvider >
    <
    App / >

    { /* ToastContainer global – toujours visible, au-dessus de tout */ } <
    ToastContainer position = "top-right"
    autoClose = { 5000 }
    hideProgressBar = { false }
    newestOnTop closeOnClick rtl = { false }
    pauseOnFocusLoss draggable pauseOnHover theme = "light" // ou "dark" si tu gères le mode sombre
    limit = { 3 } // Optionnel : max 3 notifications simultanées
    /> <
    /AuthProvider> <
    /ThemeProvider> <
    /React.StrictMode>
);