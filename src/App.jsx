import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';

export default function App() {
  const [currentPage, setCurrentPage] = useState('login'); // 'login' | 'register' | 'dashboard'
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if token exists on system initialization
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      // Auto routing validation can happen here. For now, route directly.
      setCurrentPage('dashboard');
    }
  }, []);

  const handleAuthSuccess = (userData) => {
    setUser(userData);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setCurrentPage('login');
  };

  if (currentPage === 'login') {
    return <Login onLoginSuccess={handleAuthSuccess} onSwitchToRegister={() => setCurrentPage('register')} />;
  }

  if (currentPage === 'register') {
    return <Register onRegisterSuccess={handleAuthSuccess} onSwitchToLogin={() => setCurrentPage('login')} />;
  }

  return <Dashboard user={user} onLogout={handleLogout} />;
}