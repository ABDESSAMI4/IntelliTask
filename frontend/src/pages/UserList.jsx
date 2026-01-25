import { useEffect, useState } from 'react';
import API from '../services/api';
import { toast } from 'react-toastify';

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal Création
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    password: '',
    specialty: '',
    grade: '',
    diplomas: '',
    formations: '',
  });

  // Modal Modification
  const [showEditModal, setShowEditModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    fetchUsers();
  }, []);

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

  const toggleActive = async (userId, currentActive) => {
    try {
      await API.patch(`/users/${userId}/toggle-active`);
      setUsers(users.map(u => u._id === userId ? { ...u, active: !currentActive } : u));
      toast.success('Statut modifié');
    } catch (err) {
      toast.error('Erreur');
    }
  };

  const handleCreateChange = (e) => {
    setCreateForm({ ...createForm, [e.target.name]: e.target.value });
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post('/auth/register', {
        ...createForm,
        diplomas: createForm.diplomas ? createForm.diplomas.split(',').map(d => d.trim()) : [],
        formations: createForm.formations ? createForm.formations.split(',').map(f => f.trim()) : [],
      });
      toast.success('Auditeur créé avec succès !');
      setShowCreateModal(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur création');
    }
  };

  const openEditModal = (user) => {
    setEditUser(user);
    setEditForm({
      name: user.name || '',
      email: user.email || '',
      specialty: user.specialty || '',
      grade: user.grade || '',
      diplomas: user.diplomas?.join(', ') || '',
      formations: user.formations?.join(', ') || '',
    });
    setShowEditModal(true);
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.put(`/users/${editUser._id}`, {
        ...editForm,
        diplomas: editForm.diplomas ? editForm.diplomas.split(',').map(d => d.trim()) : [],
        formations: editForm.formations ? editForm.formations.split(',').map(f => f.trim()) : [],
      });
      toast.success('Auditeur modifié !');
      setShowEditModal(false);
      fetchUsers();
    } catch (err) {
      toast.error('Erreur modification');
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Supprimer définitivement ?')) return;
    try {
      await API.delete(`/users/${userId}`);
      toast.success('Auditeur supprimé');
      fetchUsers();
    } catch (err) {
      toast.error('Erreur suppression');
    }
  };

  if (loading) return <div className="text-center py-5">Chargement...</div>;

  return (
    <div className="container py-5">
      <h2 className="text-center mb-5 text-primary">Gestion des Utilisateurs</h2>

      <div className="mb-4 text-end">
        <button className="btn btn-success btn-lg px-5" onClick={() => setShowCreateModal(true)}>
          + Créer un auditeur
        </button>
      </div>

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
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user._id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>
                  <span className={`badge ${user.role === 'superAdmin' ? 'bg-danger' : user.role === 'admin' ? 'bg-warning' : 'bg-secondary'}`}>
                    {user.role}
                  </span>
                </td>
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
                    className={`btn btn-sm me-2 ${user.active ? 'btn-danger' : 'btn-success'}`}
                  >
                    {user.active ? 'Désactiver' : 'Activer'}
                  </button>

                  {/* Modifier et Supprimer seulement pour role 'user' */}
                  {user.role === 'user' && (
                    <>
                      <button onClick={() => openEditModal(user)} className="btn btn-sm btn-warning me-2">
                        Modifier
                      </button>
                      <button onClick={() => handleDelete(user._id)} className="btn btn-sm btn-danger">
                        Supprimer
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Création */}
      {showCreateModal && (
        <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Créer un auditeur</h5>
                <button type="button" className="btn-close" onClick={() => setShowCreateModal(false)}></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleCreateSubmit}>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Nom complet *</label>
                      <input type="text" name="name" className="form-control" value={createForm.name} onChange={handleCreateChange} required />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Email *</label>
                      <input type="email" name="email" className="form-control" value={createForm.email} onChange={handleCreateChange} required />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Mot de passe *</label>
                    <input type="password" name="password" className="form-control" value={createForm.password} onChange={handleCreateChange} required />
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Spécialité</label>
                      <input type="text" name="specialty" className="form-control" value={createForm.specialty} onChange={handleCreateChange} />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Grade</label>
                      <select name="grade" className="form-select" value={createForm.grade} onChange={handleCreateChange}>
                        <option value="">Choisir...</option>
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Diplômes (séparés par virgule)</label>
                    <input type="text" name="diplomas" className="form-control" value={createForm.diplomas} onChange={handleCreateChange} placeholder="Ex: Licence Info, Master IA" />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Formations (séparées par virgule)</label>
                    <input type="text" name="formations" className="form-control" value={createForm.formations} onChange={handleCreateChange} placeholder="Ex: React Avancé, AWS" />
                  </div>

                  <button type="submit" className="btn btn-primary">Créer</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Modification */}
      {showEditModal && (
        <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Modifier l'auditeur</h5>
                <button type="button" className="btn-close" onClick={() => setShowEditModal(false)}></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleEditSubmit}>
                  {/* Même formulaire que création */}
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Nom complet</label>
                      <input type="text" name="name" className="form-control" value={editForm.name} onChange={handleEditChange} />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Email</label>
                      <input type="email" name="email" className="form-control" value={editForm.email} onChange={handleEditChange} />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Spécialité</label>
                    <input type="text" name="specialty" className="form-control" value={editForm.specialty} onChange={handleEditChange} />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Grade</label>
                    <select name="grade" className="form-select" value={editForm.grade} onChange={handleEditChange}>
                      <option value="">Choisir...</option>
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Diplômes (séparés par virgule)</label>
                    <input type="text" name="diplomas" className="form-control" value={editForm.diplomas} onChange={handleEditChange} />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Formations (séparées par virgule)</label>
                    <input type="text" name="formations" className="form-control" value={editForm.formations} onChange={handleEditChange} />
                  </div>

                  <button type="submit" className="btn btn-primary">Enregistrer</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {(showCreateModal || showEditModal) && <div className="modal-backdrop fade show"></div>}
    </div>
  );
};

export default UserList;