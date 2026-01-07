// src/App.js - Version finale corrigée, sans erreur de compilation
import { useEffect } from 'react';
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate,
    useLocation,
} from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify'; // ← toast importé ici
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

// Composants
import Header from './components/layout/Header';
// import FloatingChatButton from './components/layout/FloatingChatButton'; // ← Commenté : fichier non trouvé

// Utils
import ProtectedRoute from './utils/ProtectedRoute';

// Socket.io
import socket from './socket'; // ← src/socket.js doit exister

// Layout pour Header (sans FloatingChatButton pour l'instant)
const MainLayout = ({ children }) => {
    const location = useLocation();
    const noHeaderRoutes = ['/login', '/register', '/about'];

    const showHeader = !noHeaderRoutes.includes(location.pathname);

    return ( <
        > { showHeader && < Header / > } <
        main className = "flex-grow-1 pt-5" > { children } <
        /main> <
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

        // Notification demande véhicule acceptée/refusée
        socket.on('vehicleRequestUpdate', (data) => {
            if (data.status === 'acceptée') {
                toast.success(data.message || '✅ Votre demande de véhicule a été acceptée !');
            } else {
                toast.warning(data.message || '❌ Votre demande a été refusée.');
            }
        });

        // Nouvelle demande pour admin
        socket.on('newVehicleRequest', (data) => {
            if (window.location.pathname.includes('/admin')) {
                toast.info(`📥 Nouvelle demande : ${data.vehicle || 'un véhicule'} par ${data.user || 'un auditeur'}`);
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
                    /MainLayout>

                    { /* Footer */ } <
                    footer className = "bg-dark text-white text-center py-4 mt-auto" >
                    <
                    small > ©2026 IntelliTask - Gestion intelligente des tâches et du parc automobile < /small> <
                    /footer>

                    { /* ToastContainer GLOBAL */ } <
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
                    /div> <
                    /Router>
                );
            }

            export default App;