// src/App.js - Version finale complète, corrigée et fonctionnelle (ESLint OK)
import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify'; // ← toast importé ici
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import io from 'socket.io-client';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import DashboardAdmin from './pages/DashboardAdmin';
import DashboardUser from './pages/DashboardUser';
import TaskList from './pages/TaskList';
import TaskCreate from './pages/TaskCreate';
import UserList from './pages/UserList';
import HistoryGlobal from './pages/HistoryGlobal';
import HistoryUser from './pages/HistoryUser';
import About from './pages/About';
import VehicleList from './pages/VehicleList';
import RequestVehicle from './pages/RequestVehicle';
import VehicleRequestsAdmin from './pages/VehicleRequestsAdmin';

// Composants
import Header from './components/layout/Header';
import FloatingChatButton from './components/FloatingChatButton';

// Utils
import ProtectedRoute from './utils/ProtectedRoute';

// Connexion Socket.io globale
const socket = io('http://localhost:5000', {
    transports: ['websocket'],
    autoConnect: true,
});

// Layout pour Header et Chat flottant
const MainLayout = ({ children }) => {
    const location = useLocation();
    const noHeaderRoutes = ['/login', '/register'];
    const noChatRoutes = ['/login', '/register'];

    return ( <
        >
        {!noHeaderRoutes.includes(location.pathname) && < Header / > } { children } {!noChatRoutes.includes(location.pathname) && < FloatingChatButton / > } <
        />
    );
};

function App() {
    // Socket.io : notifications en temps réel
    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                if (user && user._id) {
                    socket.emit('joinUserRoom', user._id);
                }
            } catch (e) {
                console.error('Erreur parsing user localStorage', e);
            }
        }

        // Notification quand une demande est acceptée/refusée (pour l'auditeur)
        socket.on('vehicleRequestUpdate', (data) => {
            if (data.status === 'acceptée') {
                toast.success(data.message || '✅ Votre demande de véhicule a été acceptée !');
            } else {
                toast.warning(data.message || '❌ Votre demande a été refusée.');
            }
        });

        // Notification pour admin : nouvelle demande arrivée
        socket.on('newVehicleRequest', (data) => {
            if (window.location.pathname.includes('/admin')) {
                toast.info(`📥 Nouvelle demande : ${data.vehicle || 'un véhicule'} (${data.user || 'un auditeur'})`);
            }
        });

        // Cleanup
        return () => {
            socket.off('vehicleRequestUpdate');
            socket.off('newVehicleRequest');
        };
    }, []);

    return ( <
            Router >
            <
            div className = "d-flex flex-column min-vh-100 bg-light" >
            <
            MainLayout >
            <
            main className = "flex-grow-1 pt-5" >
            <
            ToastContainer position = "top-right"
            autoClose = { 5000 }
            hideProgressBar = { false }
            newestOnTop closeOnClick pauseOnHover theme = "light" /
            >

            <
            Routes > { /* Routes publiques */ } <
            Route path = "/login"
            element = { < Login / > }
            /> <
            Route path = "/register"
            element = { < Register / > }
            /> <
            Route path = "/about"
            element = { < About / > }
            />

            { /* Routes protégées - tous les utilisateurs */ } <
            Route element = { < ProtectedRoute allowedRoles = {
                    ['user', 'admin', 'superAdmin']
                }
                />}> <
                Route path = "/dashboard"
                element = { < DashboardUser / > }
                /> <
                Route path = "/history"
                element = { < HistoryUser / > }
                /> <
                Route path = "/request-vehicle"
                element = { < RequestVehicle / > }
                /> < /
                Route >

                { /* Routes admin / superAdmin */ } <
                Route element = { < ProtectedRoute allowedRoles = {
                        ['admin', 'superAdmin']
                    }
                    />}> <
                    Route path = "/admin/dashboard"
                    element = { < DashboardAdmin / > }
                    /> <
                    Route path = "/admin/tasks"
                    element = { < TaskList / > }
                    /> <
                    Route path = "/admin/tasks/create"
                    element = { < TaskCreate / > }
                    /> <
                    Route path = "/admin/users"
                    element = { < UserList / > }
                    /> <
                    Route path = "/admin/history"
                    element = { < HistoryGlobal / > }
                    /> <
                    Route path = "/admin/vehicles"
                    element = { < VehicleList / > }
                    /> <
                    Route path = "/admin/vehicle-requests"
                    element = { < VehicleRequestsAdmin / > }
                    /> < /
                    Route >

                    { /* Accueil */ } <
                    Route path = "/"
                    element = { < Navigate to = "/login"
                        replace / >
                    }
                    />

                    { /* 404 */ } <
                    Route
                    path = "*"
                    element = { <
                        div className = "container text-center py-5 mt-5" >
                        <
                        h1 className = "display-1 text-danger fw-bold" > 404 < /h1> <
                        h2 className = "mb-4" > Page non trouvée < /h2> <
                        a href = "/login"
                        className = "btn btn-primary btn-lg" >
                        Retour à la connexion <
                        /a> < /
                        div >
                    }
                    /> < /
                    Routes > <
                    /main> < /
                    MainLayout >

                    <
                    footer className = "bg-dark text-white text-center py-4 mt-auto" >
                    <
                    small > ©2026 IntelliTask - Gestion intelligente des tâches et du parc automobile < /small> < /
                    footer > <
                    /div> < /
                    Router >
                );
            }

            export default App;