// src/pages/DashboardAdmin.jsx
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';  // ← Import séparé
import { useEffect, useState } from 'react';
import API from '../services/api';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Export PDF/Excel

import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const DashboardAdmin = () => {
  const [stats, setStats] = useState({
    totalTasks: 0,
    pendingTasks: 0,
    acceptedTasks: 0,
    tasksByUser: [],
    tasksByStatus: {}
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const tasksRes = await API.get('/tasks');
        const assignmentsRes = await API.get('/assignments');

        const tasks = tasksRes.data;
        const assignments = assignmentsRes.data;

        const pending = assignments.filter(a => a.status === 'pending').length;
        const accepted = assignments.filter(a => a.status === 'accepted').length;

        const statusCount = tasks.reduce((acc, t) => {
          acc[t.status || 'ouverte'] = (acc[t.status || 'ouverte'] || 0) + 1;
          return acc;
        }, {});

        const userCount = assignments
          .filter(a => a.status === 'accepted')
          .reduce((acc, a) => {
            const name = a.userId?.name || 'Inconnu';
            acc[name] = (acc[name] || 0) + 1;
            return acc;
          }, {});

        setStats({
          totalTasks: tasks.length,
          pendingTasks: pending,
          acceptedTasks: accepted,
          tasksByUser: Object.entries(userCount).map(([name, count]) => ({ name, count })),
          tasksByStatus: statusCount
        });
        setLoading(false);
      } catch (err) {
        console.error('Erreur chargement stats:', err);
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // ==================== EXPORT PDF ====================
 const exportPDF = () => {
  const doc = new jsPDF('p', 'mm', 'a4');
  
  // Titre
  doc.setFontSize(18);
  doc.text('Rapport TaskMe - Dashboard Administrateur', 14, 20);
  
  doc.setFontSize(12);
  doc.text(`Date : ${new Date().toLocaleDateString('fr-FR')}`, 14, 30);

  // Stats
  doc.setFontSize(14);
  doc.text('Statistiques Générales', 14, 45);
  doc.setFontSize(11);
  doc.text(`• Tâches totales : ${stats.totalTasks}`, 20, 55);
  doc.text(`• Tâches en attente : ${stats.pendingTasks}`, 20, 65);
  doc.text(`• Tâches acceptées : ${stats.acceptedTasks}`, 20, 75);

  // Tableau
  const tableData = stats.tasksByUser.map((u, i) => [
    i + 1,
    u.name,
    u.count
  ]);

  // Utilise autoTable comme fonction séparée
  autoTable(doc, {
    head: [['#', 'Employé', 'Tâches acceptées']],
    body: tableData,
    startY: 90,
    theme: 'grid',
    headStyles: { fillColor: [54, 162, 235] },
    styles: { fontSize: 10 }
  });

  doc.save('taskme_dashboard_admin.pdf');
};

  // ==================== EXPORT EXCEL ====================
  const exportExcel = () => {
    const data = [
      ['TaskMe - Rapport Dashboard Administrateur'],
      [`Date : ${new Date().toLocaleDateString('fr-FR')}`],
      [],
      ['Statistiques Générales'],
      ['Description', 'Valeur'],
      ['Tâches totales', stats.totalTasks],
      ['Tâches en attente', stats.pendingTasks],
      ['Tâches acceptées', stats.acceptedTasks],
      [],
      ['Tâches acceptées par employé'],
      ['Employé', 'Nombre de tâches'],
      ...stats.tasksByUser.map(u => [u.name, u.count])
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Dashboard');

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([wbout], { type: 'application/octet-stream' }), 'taskme_dashboard_admin.xlsx');
  };

  // ==================== GRAPHIQUES ====================
  const barData = {
    labels: stats.tasksByUser.map(u => u.name),
    datasets: [{
      label: 'Tâches acceptées',
      data: stats.tasksByUser.map(u => u.count),
      backgroundColor: 'rgba(75, 192, 192, 0.7)',
      borderColor: 'rgba(75, 192, 192, 1)',
      borderWidth: 1
    }]
  };

  const doughnutData = {
    labels: Object.keys(stats.tasksByStatus),
    datasets: [{
      data: Object.values(stats.tasksByStatus),
      backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
      hoverOffset: 10
    }]
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" style={{width: '3rem', height: '3rem'}} role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
        <p className="mt-3">Chargement du dashboard administrateur...</p>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <h2 className="text-center mb-4 text-primary fw-bold">Dashboard Administrateur</h2>

      {/* Boutons Export */}
      <div className="text-center mb-5">
        <button onClick={exportPDF} className="btn btn-danger btn-lg me-4 px-5">
          📄 Exporter en PDF
        </button>
        <button onClick={exportExcel} className="btn btn-success btn-lg px-5">
          📊 Exporter en Excel
        </button>
      </div>

      {/* Cartes Stats */}
      <div className="row g-4 mb-5">
        <div className="col-md-4">
          <div className="card text-center p-4 shadow-lg border-0">
            <h5 className="text-secondary">Tâches totales</h5>
            <h2 className="text-primary fw-bold">{stats.totalTasks}</h2>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card text-center p-4 shadow-lg border-0">
            <h5 className="text-secondary">En attente</h5>
            <h2 className="text-warning fw-bold">{stats.pendingTasks}</h2>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card text-center p-4 shadow-lg border-0">
            <h5 className="text-secondary">Acceptées</h5>
            <h2 className="text-success fw-bold">{stats.acceptedTasks}</h2>
          </div>
        </div>
      </div>

      {/* Graphiques */}
      <div className="row g-4">
        <div className="col-lg-6">
          <div className="card shadow-lg p-4">
            <h5 className="text-center mb-4 text-secondary">Répartition par statut</h5>
            <Doughnut data={doughnutData} options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }} />
          </div>
        </div>
        <div className="col-lg-6">
          <div className="card shadow-lg p-4">
            <h5 className="text-center mb-4 text-secondary">Tâches acceptées par employé</h5>
            <Bar data={barData} options={{ responsive: true, scales: { y: { beginAtZero: true } } }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardAdmin;