// src/services/api.js - Version corrigée pour dev + prod (sans optional chaining)
import axios from 'axios';

const API = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
    withCredentials: true, // Important pour cookies/sessions
    timeout: 10000, // Sécurité contre les requêtes qui pendent
});

API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Gestion globale des erreurs (sans optional chaining)
API.interceptors.response.use(
    (response) => response,
    (error) => {
        // Vérification classique sans ?.
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }

        // Log erreur (optionnel)
        console.error('API Error:', error.response ? error.response.data : error.message);

        return Promise.reject(error);
    }
);

export default API;