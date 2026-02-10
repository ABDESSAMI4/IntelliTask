import { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import API from '../services/api';
import { toast } from 'react-toastify';
import { Container, Row, Col, Card, Form, Button, Alert, Table, Modal, Badge } from 'react-bootstrap';

const AdminPanel = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('roles'); // 'roles', 'settings', 'users'
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState('');
  const [platfromSettings, setFormSettings] = useState({
    appName: 'Taskme',
    appVersion: '1.0.0',
    maintenanceMode: false,
    maxUsersPerTask: 5,
  });

  // Vérifier que c'est un SuperAdmin
  useEffect(() => {
    if (user?.role !== 'superAdmin') {
      window.location.href = '/admin/dashboard';
      toast.error('Accès réservé aux SuperAdmin');
    }
  }, [user]);

  // Fetch tous les utilisateurs
  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/users');
      setUsers(data);
    } catch (error) {
      toast.error('Erreur lors du chargement des utilisateurs');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Changer le rôle d'un utilisateur
  const handleChangeRole = async () => {
    if (!selectedUser || !newRole) {
      toast.error('Veuillez sélectionner un utilisateur et un rôle');
      return;
    }

    try {
      await API.patch(`/users/${selectedUser._id}/change-role`, { newRole });
      toast.success(`Rôle changé en ${newRole}`);
      setShowRoleModal(false);
      setSelectedUser(null);
      setNewRole('');
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors du changement de rôle');
    }
  };

  // Activer/Désactiver un utilisateur
  const handleToggleActive = async (userId) => {
    try {
      await API.patch(`/users/${userId}/toggle-active`);
      toast.success('Statut de l\'utilisateur modifié');
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de la modification');
    }
  };

  // Supprimer un utilisateur
  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer ${userName} ?`)) {
      return;
    }

    try {
      await API.delete(`/users/${userId}`);
      toast.success('Utilisateur supprimé');
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  // Sauvegarder les paramètres
  const handleSaveSettings = async () => {
    try {
      // Vous pouvez implémenter un endpoint /settings pour sauvegarder ces données
      toast.success('Paramètres sauvegardés');
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  return (
    <Container className="py-5">
      {/* En-tête */}
      <Row className="mb-5">
        <Col>
          <h1 className="display-4 fw-bold text-primary">Panel SuperAdmin</h1>
          <p className="text-muted fs-5">Gestion globale de la plateforme Taskme</p>
          <Alert variant="info" className="mt-3">
            <strong>⚠️ Zone réservée :</strong> Seuls les SuperAdmin peuvent accéder à cette section pour configurer la plateforme globalement.
          </Alert>
        </Col>
      </Row>

      {/* Onglets */}
      <Row className="mb-4">
        <Col>
          <div className="btn-group w-100" role="group">
            <button
              type="button"
              className={`btn btn-lg ${activeTab === 'roles' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setActiveTab('roles')}
            >
              👥 Gestion des Rôles
            </button>
            <button
              type="button"
              className={`btn btn-lg ${activeTab === 'users' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setActiveTab('users')}
            >
              👤 Utilisateurs
            </button>
            <button
              type="button"
              className={`btn btn-lg ${activeTab === 'settings' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setActiveTab('settings')}
            >
              ⚙️ Paramètres Système
            </button>
          </div>
        </Col>
      </Row>

      {/* Contenu des onglets */}

      {/* Onglet: Gestion des Rôles */}
      {activeTab === 'roles' && (
        <Row>
          <Col lg={8}>
            <Card className="shadow-sm">
              <Card.Header className="bg-primary text-white">
                <Card.Title className="mb-0">Attribuer des Rôles</Card.Title>
              </Card.Header>
              <Card.Body>
                <p className="text-muted">Sélectionnez un utilisateur pour changer son rôle</p>
                {loading ? (
                  <p>Chargement...</p>
                ) : (
                  <Table striped hover responsive>
                    <thead>
                      <tr>
                        <th>Nom</th>
                        <th>Email</th>
                        <th>Rôle Actuel</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.filter(u => u.role !== 'superAdmin' || u._id === user?._id).map(u => (
                        <tr key={u._id}>
                          <td>{u.name}</td>
                          <td>{u.email}</td>
                          <td>
                            <Badge
                              bg={
                                u.role === 'superAdmin' ? 'danger'
                                : u.role === 'admin' ? 'warning'
                                : 'success'
                              }
                            >
                              {u.role}
                            </Badge>
                          </td>
                          <td>
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => {
                                setSelectedUser(u);
                                setNewRole(u.role);
                                setShowRoleModal(true);
                              }}
                            >
                              Modifier
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </Card.Body>
            </Card>
          </Col>
          <Col lg={4}>
            <Card className="shadow-sm bg-light">
              <Card.Header>
                <Card.Title className="mb-0">📋 Hiérarchie des Rôles</Card.Title>
              </Card.Header>
              <Card.Body>
                <div className="mb-3">
                  <h6 className="text-danger fw-bold">👑 SuperAdmin</h6>
                  <p className="small">Accès complet à tous les paramètres et utilisateurs</p>
                </div>
                <div className="mb-3">
                  <h6 className="text-warning fw-bold">🔧 Admin</h6>
                  <p className="small">Gestion des tâches et utilisateurs (User uniquement)</p>
                </div>
                <div>
                  <h6 className="text-success fw-bold">👤 User</h6>
                  <p className="small">Auditeur, accès aux fonctionnalités de base</p>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Onglet: Utilisateurs */}
      {activeTab === 'users' && (
        <Row>
          <Col>
            <Card className="shadow-sm">
              <Card.Header className="bg-primary text-white">
                <Card.Title className="mb-0">Gestion des Utilisateurs</Card.Title>
              </Card.Header>
              <Card.Body>
                {loading ? (
                  <p>Chargement...</p>
                ) : (
                  <div className="table-responsive">
                    <Table striped hover>
                      <thead>
                        <tr>
                          <th>Nom</th>
                          <th>Email</th>
                          <th>Rôle</th>
                          <th>Statut</th>
                          <th>Spécialité</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map(u => (
                          <tr key={u._id}>
                            <td>{u.name}</td>
                            <td>{u.email}</td>
                            <td>
                              <Badge
                                bg={
                                  u.role === 'superAdmin' ? 'danger'
                                  : u.role === 'admin' ? 'warning'
                                  : 'success'
                                }
                              >
                                {u.role}
                              </Badge>
                            </td>
                            <td>
                              <Badge bg={u.active ? 'success' : 'secondary'}>
                                {u.active ? 'Actif' : 'Inactif'}
                              </Badge>
                            </td>
                            <td>{u.specialty || '-'}</td>
                            <td>
                              {u.role !== 'superAdmin' && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline-secondary"
                                    className="me-1"
                                    onClick={() => handleToggleActive(u._id)}
                                  >
                                    {u.active ? 'Désactiver' : 'Activer'}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="danger"
                                    onClick={() => handleDeleteUser(u._id, u.name)}
                                  >
                                    Supprimer
                                  </Button>
                                </>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Onglet: Paramètres Système */}
      {activeTab === 'settings' && (
        <Row>
          <Col lg={8}>
            <Card className="shadow-sm">
              <Card.Header className="bg-primary text-white">
                <Card.Title className="mb-0">Configuration Système</Card.Title>
              </Card.Header>
              <Card.Body>
                <Form>
                  <Form.Group className="mb-3">
                    <Form.Label>Nom de l'Application</Form.Label>
                    <Form.Control
                      type="text"
                      value={platfromSettings.appName}
                      onChange={(e) =>
                        setFormSettings({ ...platfromSettings, appName: e.target.value })
                      }
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Version</Form.Label>
                    <Form.Control
                      type="text"
                      value={platfromSettings.appVersion}
                      onChange={(e) =>
                        setFormSettings({ ...platfromSettings, appVersion: e.target.value })
                      }
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Nombre Max d'Auditeurs par Tâche</Form.Label>
                    <Form.Control
                      type="number"
                      value={platfromSettings.maxUsersPerTask}
                      onChange={(e) =>
                        setFormSettings({
                          ...platfromSettings,
                          maxUsersPerTask: parseInt(e.target.value),
                        })
                      }
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Check
                      type="checkbox"
                      label="Mode Maintenance"
                      checked={platfromSettings.maintenanceMode}
                      onChange={(e) =>
                        setFormSettings({
                          ...platfromSettings,
                          maintenanceMode: e.target.checked,
                        })
                      }
                    />
                    <Form.Text className="text-muted">
                      Si activé, seuls les SuperAdmin pourront accéder à l'application
                    </Form.Text>
                  </Form.Group>

                  <Button variant="success" onClick={handleSaveSettings}>
                    💾 Sauvegarder
                  </Button>
                </Form>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={4}>
            <Card className="shadow-sm bg-light">
              <Card.Header>
                <Card.Title className="mb-0">🔍 Statistiques</Card.Title>
              </Card.Header>
              <Card.Body>
                <div className="mb-3 p-3 bg-white rounded">
                  <p className="text-muted">Total Utilisateurs</p>
                  <h3 className="text-primary fw-bold">{users.length}</h3>
                </div>
                <div className="mb-3 p-3 bg-white rounded">
                  <p className="text-muted">SuperAdmins</p>
                  <h3 className="text-danger fw-bold">{users.filter(u => u.role === 'superAdmin').length}</h3>
                </div>
                <div className="mb-3 p-3 bg-white rounded">
                  <p className="text-muted">Admins</p>
                  <h3 className="text-warning fw-bold">{users.filter(u => u.role === 'admin').length}</h3>
                </div>
                <div className="p-3 bg-white rounded">
                  <p className="text-muted">Auditeurs</p>
                  <h3 className="text-success fw-bold">{users.filter(u => u.role === 'user').length}</h3>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Modal: Changer le Rôle */}
      <Modal show={showRoleModal} onHide={() => setShowRoleModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Changer le Rôle</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedUser && (
            <>
              <p className="mb-3">
                <strong>Utilisateur:</strong> {selectedUser.name}
              </p>
              <p className="mb-3">
                <strong>Rôle Actuel:</strong> <Badge bg="info">{selectedUser.role}</Badge>
              </p>
              <Form.Group>
                <Form.Label>Nouveau Rôle</Form.Label>
                <Form.Select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                >
                  <option value="">Sélectionner un rôle</option>
                  <option value="user">User (Auditeur)</option>
                  <option value="admin">Admin (Coordinateur)</option>
                  <option value="superAdmin">SuperAdmin</option>
                </Form.Select>
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRoleModal(false)}>
            Annuler
          </Button>
          <Button variant="primary" onClick={handleChangeRole}>
            Confirmer
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminPanel;
