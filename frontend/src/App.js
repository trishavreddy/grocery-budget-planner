import React, { useEffect, useState } from 'react';
import './App.css';
import Login from './Login';
import Register from './Register';
import SpendingChart from './SpendingChart';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [authView, setAuthView] = useState('login');
  const [activeTab, setActiveTab] = useState('inventory');

  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', price: '', unit: '' });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [weeklyBudget, setWeeklyBudget] = useState(100);

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  });

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setIngredients([]);
  };

  const handleLogin = (accessToken, userData) => {
    localStorage.setItem('token', accessToken);
    setToken(accessToken);
    setUser(userData);
  };

  const handleRegisterSuccess = () => {
    setAuthView('login');
  };

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    fetch('http://127.0.0.1:5000/api/ingredients', {
      headers: getAuthHeaders()
    })
      .then(res => {
        if (res.status === 401) {
          handleLogout();
          throw new Error('Session expired');
        }
        if (!res.ok) throw new Error('API error');
        return res.json();
      })
      .then(data => {
        setIngredients(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [token]);

  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.name || !form.price || !form.unit) {
      setFormError('All fields required.');
      return;
    }
    setFormLoading(true);
    fetch('http://127.0.0.1:5000/api/ingredients', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: form.name,
          price: parseFloat(form.price),
          unit: form.unit
        })
      })
      .then(async (res) => {
        if (res.status === 401) {
          handleLogout();
          throw new Error('Session expired');
        }
        const data = await res.json();
        setFormLoading(false);
        if (!res.ok) {
          setFormError(data.error || 'Failed to add ingredient.');
          return;
        }
        setIngredients(prev => [...prev, {
          id: data.id, name: form.name, price: parseFloat(form.price), unit: form.unit
        }]);
        setForm({ name: '', price: '', unit: '' });
        setShowModal(false);
      })
      .catch(err => {
        setFormError(err.message || 'Network/API error');
        setFormLoading(false);
      });
  };

  // Auth screens
  if (!token) {
    return (
      <div className="App">
        <div className="auth-container">
          {authView === 'login' ? (
            <Login
              onLogin={handleLogin}
              onSwitchToRegister={() => setAuthView('register')}
            />
          ) : (
            <Register
              onRegisterSuccess={handleRegisterSuccess}
              onSwitchToLogin={() => setAuthView('login')}
            />
          )}
        </div>
      </div>
    );
  }

  // Main dashboard
  return (
    <div className="App">
      <div className="dashboard">
        {/* Header */}
        <div className="dashboard-header">
          <h1>Grocery Budget Planner</h1>
          <div className="user-info">
            {user && <span>{user.email}</span>}
            <button className="btn-logout" onClick={handleLogout}>Logout</button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="tab-nav">
          <button
            className={`tab-btn ${activeTab === 'inventory' ? 'active' : ''}`}
            onClick={() => setActiveTab('inventory')}
          >
            Inventory
          </button>
          <button
            className={`tab-btn ${activeTab === 'visualize' ? 'active' : ''}`}
            onClick={() => setActiveTab('visualize')}
          >
            Visualize
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'inventory' && (
            <>
              <div className="inventory-header">
                <h2>Ingredients ({ingredients.length})</h2>
                <button className="btn-add" onClick={() => setShowModal(true)}>
                  + Add Ingredient
                </button>
              </div>

              {loading && <div className="loading">Loading ingredients...</div>}
              {error && <div className="error-message">Error: {error}</div>}

              {!loading && ingredients.length === 0 && (
                <div className="empty-state">
                  <h3>No ingredients yet</h3>
                  <p>Click "Add Ingredient" to start tracking your grocery spending</p>
                </div>
              )}

              <div className="ingredient-grid">
                {ingredients.map(ing => (
                  <div key={ing.id} className="ingredient-card">
                    <h3>{ing.name}</h3>
                    <div className="price">${ing.price.toFixed(2)}</div>
                    <div className="unit">per {ing.unit}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {activeTab === 'visualize' && (
            <div className="visualize-page">
              <h2>Spending Analytics</h2>
              <p className="subtitle">Track your grocery budget and spending patterns</p>

              <div className="budget-input-section">
                <label>Weekly Budget</label>
                <input
                  type="number"
                  value={weeklyBudget}
                  onChange={(e) => setWeeklyBudget(parseFloat(e.target.value) || 0)}
                  placeholder="Enter budget"
                />
              </div>

              <SpendingChart ingredients={ingredients} budget={weeklyBudget} />
            </div>
          )}
        </div>

        {/* Add Ingredient Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h3>Add New Ingredient</h3>
              <form onSubmit={handleSubmit}>
                <input
                  type="text"
                  name="name"
                  placeholder="Ingredient name"
                  value={form.name}
                  onChange={handleInputChange}
                  disabled={formLoading}
                />
                <input
                  type="number"
                  step="any"
                  name="price"
                  placeholder="Price"
                  value={form.price}
                  onChange={handleInputChange}
                  disabled={formLoading}
                />
                <input
                  type="text"
                  name="unit"
                  placeholder="Unit (e.g., lb, dozen, can)"
                  value={form.unit}
                  onChange={handleInputChange}
                  disabled={formLoading}
                />
                {formError && <div className="error-message">{formError}</div>}
                <div className="modal-buttons">
                  <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-save" disabled={formLoading}>
                    {formLoading ? 'Adding...' : 'Add'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
