// src/App.js - Version finale complète et corrigée
import { useEffect } from 'react';
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate,
    useLocation,
} from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify'; // ← toast bien importé
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.min.css';

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
import Settings from './pages/Settings'; // ← Import de la page Settings

// Composants
import Header from './components/layout/Header';
import FloatingChatButton from './components/FloatingChatButton'; // ← Ajout pour le chat flottant

// Utils
import ProtectedRoute from './utils/ProtectedRoute';

// Socket.io
import socket from './socket';

const AppLayout = ({ children }) => {
    const location = useLocation();
    const noLayoutRoutes = ['/login', '/register', '/about'];

    const isNoLayout = noLayoutRoutes.includes(location.pathname);

    if (isNoLayout) {
        return < > { children } < />;
    }

    return ( <
        div className = "d-flex flex-column min-vh-100 bg-light" >
        <
        Header / >
        <
        main className = "flex-grow-1 pt-5" > { children } < /main> <
        FloatingChatButton / > { /* ← Ajout du bouton chat flottant sur les pages connectées */ } <
        /div>
    );
};

function App() {
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

        socket.on('vehicleRequestUpdate', (data) => {
            if (data.status === 'acceptée') {
                toast.success(data.message || '✅ Votre demande de véhicule a été acceptée !');
            } else {
                toast.warning(data.message || '❌ Votre demande a été refusée.');
            }
        });

        socket.on('newVehicleRequest', (data) => {
            if (window.location.pathname.includes('/admin')) {
                toast.info(`📥 Nouvelle demande : ${data.vehicle || 'un véhicule'} par ${data.user || 'un auditeur'}`);
            }
        });

        return () => {
            socket.off('vehicleRequestUpdate');
            socket.off('newVehicleRequest');
        };
    }, []);

    return ( <
            Router >
            <
            AppLayout >
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

            { /* Routes utilisateur connecté */ } <
            Route element = { < ProtectedRoute allowedRoles = {
                    ['user', 'admin', 'superAdmin'] }
                />}> <
                Route path = "/dashboard"
                element = { < DashboardUser / > }
                /> <
                Route path = "/history"
                element = { < HistoryUser / > }
                /> <
                Route path = "/request-vehicle"
                element = { < RequestVehicle / > }
                /> <
                /Route>

                { /* Routes admin / superAdmin */ } <
                Route element = { < ProtectedRoute allowedRoles = {
                        ['admin', 'superAdmin'] }
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
                    /> { /* Page Paramètres */ } <
                    Route path = "/admin/settings"
                    element = { < Settings / > }
                    /> <
                    /Route>

                    { /* Accueil */ } <
                    Route path = "/"
                    element = { < Navigate to = "/login"
                        replace / > }
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
                        /a> <
                        /div>
                    }
                    /> <
                    /Routes> <
                    /AppLayout>

                    { /* ToastContainer global */ } <
                    ToastContainer
                    position = "top-right"
                    autoClose = { 5000 }
                    hideProgressBar = { false }
                    newestOnTop
                    closeOnClick
                    pauseOnHover
                    pauseOnFocusLoss
                    draggable
                    theme = "light" /
                    >
                    <
                    /Router>
                );
            }

            export default App;