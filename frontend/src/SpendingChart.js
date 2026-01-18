import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

function SpendingChart({ ingredients, budget }) {
  // Generate colors for each ingredient
  const generateColors = (count) => {
    const colors = [
      '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
      '#FF9F40', '#FF6384', '#C9CBCF', '#7BC225', '#E8575A',
      '#2ECC71', '#3498DB', '#9B59B6', '#E74C3C', '#1ABC9C'
    ];
    return colors.slice(0, count);
  };

  // Calculate total spending
  const totalSpending = ingredients.reduce((sum, ing) => sum + ing.price, 0);

  // Doughnut chart data - spending by ingredient
  const doughnutData = {
    labels: ingredients.map(ing => ing.name),
    datasets: [{
      data: ingredients.map(ing => ing.price),
      backgroundColor: generateColors(ingredients.length),
      borderColor: '#1a1a2e',
      borderWidth: 2,
    }]
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#fff', font: { size: 12 } }
      },
      title: {
        display: true,
        text: 'Spending by Ingredient',
        color: '#fff',
        font: { size: 16 }
      }
    }
  };

  // Bar chart data - budget vs actual
  const budgetAmount = budget || 100; // Default budget
  const barData = {
    labels: ['Weekly Budget'],
    datasets: [
      {
        label: 'Budget',
        data: [budgetAmount],
        backgroundColor: '#36A2EB',
      },
      {
        label: 'Actual Spending',
        data: [totalSpending],
        backgroundColor: totalSpending > budgetAmount ? '#FF6384' : '#4BC0C0',
      }
    ]
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: { color: '#fff' }
      },
      title: {
        display: true,
        text: 'Budget vs Actual Spending',
        color: '#fff',
        font: { size: 16 }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { color: '#fff' },
        grid: { color: '#444' }
      },
      x: {
        ticks: { color: '#fff' },
        grid: { color: '#444' }
      }
    }
  };

  if (ingredients.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 20 }}>
        <p>Add ingredients to see spending charts</p>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 30, width: '100%', maxWidth: 800 }}>
      <h2>Spending Analytics</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 30, justifyContent: 'center' }}>
        <div style={{ width: 300, height: 300 }}>
          <Doughnut data={doughnutData} options={doughnutOptions} />
        </div>
        <div style={{ width: 350, height: 300 }}>
          <Bar data={barData} options={barOptions} />
        </div>
      </div>
      <div style={{ marginTop: 20, fontSize: 14 }}>
        <p>Total Spending: <strong>${totalSpending.toFixed(2)}</strong></p>
        {totalSpending > budgetAmount && (
          <p style={{ color: '#FF6384' }}>⚠️ Over budget by ${(totalSpending - budgetAmount).toFixed(2)}</p>
        )}
        {totalSpending <= budgetAmount && (
          <p style={{ color: '#4BC0C0' }}>✓ Under budget by ${(budgetAmount - totalSpending).toFixed(2)}</p>
        )}
      </div>
    </div>
  );
}

export default SpendingChart;
