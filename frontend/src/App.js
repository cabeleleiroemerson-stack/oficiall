import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './i18n';
import './App.css';

import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import AIChat from './pages/AIChat';
import ServicesPage from './pages/ServicesPage';
import ProfilePage from './pages/ProfilePage';
import AdminDashboard from './pages/AdminDashboard';
import DirectChatPage from './pages/DirectChatPage';
import VolunteersPage from './pages/VolunteersPage';
import VolunteerRegisterPage from './pages/VolunteerRegisterPage';
import NearbyHelpersPage from './pages/NearbyHelpersPage';

export const AuthContext = React.createContext();

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const { i18n } = useTranslation();

  useEffect(() => {
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data);
      } else {
        logout();
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = (newToken, userData) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={!user ? <LandingPage /> : <Navigate to="/home" />} />
          <Route path="/auth" element={!user ? <AuthPage /> : <Navigate to="/home" />} />
          <Route path="/home" element={user ? <HomePage /> : <Navigate to="/" />} />
          <Route path="/chat" element={user ? <AIChat /> : <Navigate to="/" />} />
          <Route path="/services" element={user ? <ServicesPage /> : <Navigate to="/" />} />
          <Route path="/profile" element={user ? <ProfilePage /> : <Navigate to="/" />} />
          <Route path="/admin" element={user && user.role === 'admin' ? <AdminDashboard /> : (user ? <Navigate to="/home" /> : <Navigate to="/" />)} />
          <Route path="/direct-chat/:userId" element={user ? <DirectChatPage /> : <Navigate to="/" />} />
          <Route path="/volunteers" element={user ? <VolunteersPage /> : <Navigate to="/" />} />
          <Route path="/volunteer-register" element={<VolunteerRegisterPage />} />
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}

export default App;
