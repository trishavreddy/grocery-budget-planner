import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

function SpendingChart({ ingredients, budget }) {
  const generateColors = (count) => {
    const colors = [
      '#e94560', '#36A2EB', '#FFCE56', '#4ade80', '#9966FF',
      '#FF9F40', '#ff6b6b', '#C9CBCF', '#7BC225', '#E8575A',
      '#2ECC71', '#3498DB', '#9B59B6', '#E74C3C', '#1ABC9C',
      '#F39C12', '#D35400', '#8E44AD', '#2980B9', '#27AE60'
    ];
    return colors.slice(0, count);
  };

  const totalSpending = ingredients.reduce((sum, ing) => sum + ing.price, 0);
  const budgetAmount = budget || 100;
  const remaining = budgetAmount - totalSpending;

  const doughnutData = {
    labels: ingredients.slice(0, 10).map(ing => ing.name),
    datasets: [{
      data: ingredients.slice(0, 10).map(ing => ing.price),
      backgroundColor: generateColors(Math.min(ingredients.length, 10)),
      borderColor: '#1a1a2e',
      borderWidth: 2,
    }]
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: { color: '#fff', font: { size: 11 }, padding: 10 }
      }
    }
  };

  const barData = {
    labels: ['Budget Overview'],
    datasets: [
      {
        label: 'Budget',
        data: [budgetAmount],
        backgroundColor: '#36A2EB',
        borderRadius: 5,
      },
      {
        label: 'Spent',
        data: [totalSpending],
        backgroundColor: totalSpending > budgetAmount ? '#ff6b6b' : '#4ade80',
        borderRadius: 5,
      }
    ]
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { color: '#fff', padding: 15 }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { color: '#888' },
        grid: { color: 'rgba(255,255,255,0.1)' }
      },
      x: {
        ticks: { color: '#888' },
        grid: { color: 'rgba(255,255,255,0.1)' }
      }
    }
  };

  if (ingredients.length === 0) {
    return (
      <div className="empty-state">
        <h3>No Data Yet</h3>
        <p>Add ingredients in the Inventory tab to see your spending analytics</p>
      </div>
    );
  }

  return (
    <>
      <div className="stats-summary">
        <div className="stat-card">
          <div className={`value ${remaining >= 0 ? 'green' : 'red'}`}>
            ${totalSpending.toFixed(2)}
          </div>
          <div className="label">Total Spent</div>
        </div>
        <div className="stat-card">
          <div className="value" style={{ color: '#36A2EB' }}>
            ${budgetAmount.toFixed(2)}
          </div>
          <div className="label">Weekly Budget</div>
        </div>
        <div className="stat-card">
          <div className={`value ${remaining >= 0 ? 'green' : 'red'}`}>
            {remaining >= 0 ? '+' : ''}${remaining.toFixed(2)}
          </div>
          <div className="label">{remaining >= 0 ? 'Remaining' : 'Over Budget'}</div>
        </div>
        <div className="stat-card">
          <div className="value" style={{ color: '#FFCE56' }}>
            {ingredients.length}
          </div>
          <div className="label">Items Tracked</div>
        </div>
      </div>

      <div className="charts-container">
        <div className="chart-card">
          <h3 style={{ marginBottom: 15, fontSize: '1rem' }}>Spending by Item</h3>
          <div style={{ width: 350, height: 250 }}>
            <Doughnut data={doughnutData} options={doughnutOptions} />
          </div>
        </div>
        <div className="chart-card">
          <h3 style={{ marginBottom: 15, fontSize: '1rem' }}>Budget vs Actual</h3>
          <div style={{ width: 300, height: 250 }}>
            <Bar data={barData} options={barOptions} />
          </div>
        </div>
      </div>
    </>
  );
}

export default SpendingChart;
