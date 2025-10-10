import React, { useState, useEffect } from 'react';
import LoginScreen from './components/LoginScreen';
import RegistrationScreen from './components/RegistrationScreen';
import AdminDashboard from './components/AdminDashboard';
import EmployeeDashboard from './components/EmployeeDashboard';
import VendorPortal from './components/VendorPortal';
import { apiCall } from './utils/api';

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRegistration, setShowRegistration] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await apiCall('/api/auth/current-user');
      if (response.success && response.user) {
        setUser(response.user);
      }
    } catch (error) {
      console.log('Not authenticated');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = async () => {
    try {
      await apiCall('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="text-center">
          <div className="relative mb-4">
            <div className="w-16 h-16 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg"></div>
            </div>
          </div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    if (showRegistration) {
      return <RegistrationScreen onBack={() => setShowRegistration(false)} onLogin={handleLogin} />;
    }
    return <LoginScreen onLogin={handleLogin} onRegister={() => setShowRegistration(true)} />;
  }

  // Route to appropriate dashboard based on user type
  if (user.userType === 'admin' || user.user_type === 'admin') {
    return <AdminDashboard user={user} onLogout={handleLogout} />;
  } else if (user.userType === 'employee' || user.user_type === 'employee') {
    return <EmployeeDashboard user={user} onLogout={handleLogout} />;
  } else if (user.userType === 'vendor' || user.user_type === 'vendor') {
    return <VendorPortal user={user} onLogout={handleLogout} />;
  }

  return <LoginScreen onLogin={handleLogin} onRegister={() => setShowRegistration(true)} />;
};

export default App;
