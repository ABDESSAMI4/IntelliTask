import { useEffect, useState } from 'react';
import API from '../services/api';

const statusConfig = {
  accepted: {
    label: 'Accepté',
    class: 'bg-success text-white border border-success',
    icon: '✔',
  },
  refused: {
    label: 'Refusé',
    class: 'bg-danger text-white border border-danger',
    icon: '✖',
  },
  pending: {
    label: 'En attente',
    class: 'bg-warning text-dark border border-warning',
    icon: '⏳',
  },
};

const MyAssignments = () => {
  const [assignments, setAssignments] = useState([]);

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const { data } = await API.get('/assignments');
        setAssignments(data);
      } catch (error) {
        console.error('Erreur fetch assignments:', error);
      }
    };
    fetchAssignments();
  }, []);

  return (
    <div className="min-vh-100 bg-light p-4">
      <div className="container">
        {/* Titre */}
        <h2 className="mb-4 fw-bold text-secondary d-flex align-items-center gap-2">
          <span style={{fontSize: '1.8rem'}}>📋</span> Mes Affectations
        </h2>

        {/* Carte tableau */}
        <div className="card shadow-sm border-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="table-primary text-primary">
                <tr>
                  <th className="fw-semibold">Nom de la tâche</th>
                  <th className="fw-semibold">Auditeur</th>
                  <th className="fw-semibold text-center">Statut</th>
                </tr>
              </thead>

              <tbody>
                {assignments.map((ass, index) => {
                  const status = statusConfig[ass.status];

                  return (
                    <tr key={ass._id} className={index % 2 === 0 ? '' : 'table-active'}>
                      {/* Nom tâche */}
                      <td className="fw-medium text-secondary">
                        {ass.taskId?.name || '—'}
                      </td>

                      {/* Auditeur */}
                      <td className="text-muted">
                        {ass.userId?.name || ass.userId?.email || '—'}
                      </td>

                      {/* Statut */}
                      <td className="text-center">
                        <span className={`badge ${status?.class} fs-6`}>
                          <span className="me-2">{status?.icon}</span>
                          {status?.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {assignments.length === 0 && (
            <div className="p-5 text-center text-muted fst-italic">
              Aucune affectation trouvée.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyAssignments;
