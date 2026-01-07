// src/pages/UserList.jsx
import { useEffect, useState } from 'react';
import API from '../services/api';
import { toast } from 'react-toastify';

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await API.get('/users');
        setUsers(res.data);
        setLoading(false);
      } catch (err) {
        toast.error('Erreur chargement utilisateurs');
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const toggleActive = async (userId, currentActive) => {
    try {
      await API.patch(`/users/${userId}/toggle-active`);
      setUsers(users.map(u => u._id === userId ? { ...u, active: !currentActive } : u));
      toast.success('Statut modifié');
    } catch (err) {
      toast.error('Erreur');
    }
  };

  if (loading) return <div className="text-center py-5">Chargement...</div>;

  return (
    <div className="container py-5">
      <h2 className="text-center mb-5 text-primary">Gestion des Utilisateurs</h2>
      <div className="table-responsive">
        <table className="table table-hover shadow">
          <thead className="table-primary">
            <tr>
              <th>Nom</th>
              <th>Email</th>
              <th>Rôle</th>
              <th>Spécialité</th>
              <th>Grade</th>
              <th>Statut</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user._id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td><span className={`badge ${user.role === 'superAdmin' ? 'bg-danger' : user.role === 'admin' ? 'bg-warning' : 'bg-secondary'}`}>
                  {user.role}
                </span></td>
                <td>{user.specialty || '-'}</td>
                <td>{user.grade || '-'}</td>
                <td>
                  <span className={`badge ${user.active ? 'bg-success' : 'bg-danger'}`}>
                    {user.active ? 'Actif' : 'Inactif'}
                  </span>
                </td>
                <td>
                  <button
                    onClick={() => toggleActive(user._id, user.active)}
                    className={`btn btn-sm ${user.active ? 'btn-danger' : 'btn-success'}`}
                  >
                    {user.active ? 'Désactiver' : 'Activer'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserList;