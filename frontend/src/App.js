import React, { useEffect, useState } from 'react';
import './App.css';
import Login from './Login';
import Register from './Register';
import SpendingChart from './SpendingChart';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [authView, setAuthView] = useState('login');

  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
      })
      .catch(err => {
        setFormError(err.message || 'Network/API error');
        setFormLoading(false);
      });
  };

  if (!token) {
    return (
      <div className="App">
        <header className="App-header">
          <h1>Grocery Budget Planner</h1>
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
        </header>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="App-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: 600 }}>
          <h1>Grocery Budget Planner</h1>
          <button onClick={handleLogout} style={{ padding: '8px 16px' }}>Logout</button>
        </div>
        <p>Track your grocery spend, auto-generate weekly meal plans, and visualize your budget!</p>
        {user && <p>Logged in as: {user.email}</p>}
        <h2>Ingredients</h2>
        {loading && <div>Loading ingredients...</div>}
        {error && <div>Error: {error}</div>}
        <ul>
          {ingredients.map(ing => (
            <li key={ing.id}>{ing.name} (${ing.price} per {ing.unit})</li>
          ))}
        </ul>
        <h3>Add Ingredient</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', maxWidth: 350, margin: 'auto' }}>
          <input
            type="text"
            name="name"
            placeholder="Name (e.g. Eggs)"
            value={form.name}
            onChange={handleInputChange}
            disabled={formLoading}
          />
          <input
            type="number"
            step="any"
            name="price"
            placeholder="Price (e.g. 2.99)"
            value={form.price}
            onChange={handleInputChange}
            disabled={formLoading}
          />
          <input
            type="text"
            name="unit"
            placeholder="Unit (e.g. dozen, lb, can)"
            value={form.unit}
            onChange={handleInputChange}
            disabled={formLoading}
          />
          <button type="submit" disabled={formLoading}>Add Ingredient</button>
          {formError && <div style={{ color: 'red', marginTop: 8 }}>{formError}</div>}
        </form>

        <div style={{ marginTop: 30, maxWidth: 350 }}>
          <h3>Set Weekly Budget</h3>
          <input
            type="number"
            value={weeklyBudget}
            onChange={(e) => setWeeklyBudget(parseFloat(e.target.value) || 0)}
            placeholder="Weekly budget"
            style={{ width: '100%', padding: 10 }}
          />
        </div>

        <SpendingChart ingredients={ingredients} budget={weeklyBudget} />
      </header>
    </div>
  );
}

export default App;
