// src/utils/ProtectedRoute.jsx
import { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div className="text-center py-5">Chargement...</div>;

  if (!user) return <Navigate to="/login" />;

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <div className="text-center py-5 text-danger h2">Accès refusé : rôle insuffisant</div>;
  }

  return <Outlet />;
};

export default ProtectedRoute;