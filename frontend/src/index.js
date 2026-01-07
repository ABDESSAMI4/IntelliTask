// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Styles globaux
import App from './App';

// Contexts
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';

// Toast notifications (si tu utilises react-toastify)
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render( <
    React.StrictMode >
    <
    ThemeProvider >
    <
    AuthProvider >
    <
    App / > { /* ToastContainer global – toujours à la fin pour être au-dessus de tout */ } <
    ToastContainer position = "top-right"
    autoClose = { 5000 }
    hideProgressBar = { false }
    newestOnTop closeOnClick rtl = { false }
    pauseOnFocusLoss draggable pauseOnHover theme = "light" // ou "dark" selon ton thème
    limit = { 3 } // Optionnel : limite à 3 toasts simultanés
    /> <
    /AuthProvider> <
    /ThemeProvider> <
    /React.StrictMode>
);