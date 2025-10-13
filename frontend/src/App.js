import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginScreen from './components/LoginScreen';
import RegistrationScreen from './components/RegistrationScreen';
import AdminDashboard from './components/AdminDashboard';
import EmployeeDashboard from './components/EmployeeDashboard';
import VendorPortal from './components/VendorPortal';
import VendorPortalFullAccess from './components/VendorPortalFullAccess';
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

  return (
    <Router>
      <AppRoutes 
        user={user} 
        onLogin={handleLogin} 
        onLogout={handleLogout}
        showRegistration={showRegistration}
        setShowRegistration={setShowRegistration}
      />
    </Router>
  );
};

const AppRoutes = ({ user, onLogin, onLogout, showRegistration, setShowRegistration }) => {
  // Protected route component
  const ProtectedRoute = ({ children, allowedUserTypes }) => {
    if (!user) {
      return <Navigate to="/" replace />;
    }
    
    const userType = user.userType || user.user_type;
    if (!allowedUserTypes.includes(userType)) {
      return <Navigate to="/" replace />;
    }
    
    return children;
  };

  return (
    <Routes>
      {/* Root route - show login page */}
      <Route path="/" element={
        !user ? (
          showRegistration ? (
            <RegistrationScreen onBack={() => setShowRegistration(false)} onLogin={onLogin} />
          ) : (
            <LoginScreen onLogin={onLogin} onRegister={() => setShowRegistration(true)} />
          )
        ) : (
          <Navigate to={`/${user?.userType || user?.user_type || 'admin'}`} replace />
        )
      } />
      
      {/* Dashboard routes - only accessible after login */}
      <Route path="/admin" element={
        <ProtectedRoute allowedUserTypes={['admin']}>
          <AdminDashboard user={user} onLogout={onLogout} />
        </ProtectedRoute>
      } />
      
      <Route path="/employee" element={
        <ProtectedRoute allowedUserTypes={['employee']}>
          <EmployeeDashboard user={user} onLogout={onLogout} />
        </ProtectedRoute>
      } />
      
      <Route path="/vendor" element={
        <ProtectedRoute allowedUserTypes={['vendor']}>
          {user && user.has_full_access ? (
            <VendorPortalFullAccess user={user} onLogout={onLogout} />
          ) : (
            <VendorPortal user={user} onLogout={onLogout} />
          )}
        </ProtectedRoute>
      } />
      
      {/* Registration route */}
      <Route path="/register" element={
        showRegistration ? (
          <RegistrationScreen onBack={() => setShowRegistration(false)} onLogin={onLogin} />
        ) : (
          <Navigate to="/" replace />
        )
      } />
      
      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
