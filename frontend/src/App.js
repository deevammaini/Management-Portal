import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LoginScreen from './components/LoginScreen';
import RegistrationScreen from './components/RegistrationScreen';
import AdminDashboard from './components/AdminDashboard';
import EmployeeDashboard from './components/EmployeeDashboard';
import VendorPortal from './components/VendorPortal';
import VendorPortalFullAccess from './components/VendorPortalFullAccess';
import ComprehensiveRegistrationForm from './components/ComprehensiveRegistrationForm';
import VendorRegistrationPage from './components/VendorRegistrationPage';
import { apiCall } from './utils/api';
import { SocketProvider } from './contexts/SocketContext';

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRegistration, setShowRegistration] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // First check if user data exists in sessionStorage
      const storedUser = sessionStorage.getItem('user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        console.log('Found stored user:', userData);
        setUser(userData);
        setLoading(false);
        return;
      }
      
      // If no stored user, check with API
      const response = await apiCall('/api/auth/current-user');
      if (response.success && response.user) {
        console.log('API returned user:', response.user);
        setUser(response.user);
        // Store user data in sessionStorage for persistence
        sessionStorage.setItem('user', JSON.stringify(response.user));
      }
    } catch (error) {
      console.log('Not authenticated:', error);
      // Clear any invalid stored data
      sessionStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (userData) => {
    console.log('User logged in:', userData);
    setUser(userData);
    // Store user data in sessionStorage for persistence
    sessionStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = async () => {
    try {
      await apiCall('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      // Clear user data from sessionStorage
      sessionStorage.removeItem('user');
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
    <SocketProvider>
      <Router>
        <AppRoutes 
          user={user} 
          onLogin={handleLogin} 
          onLogout={handleLogout}
          showRegistration={showRegistration}
          setShowRegistration={setShowRegistration}
        />
      </Router>
    </SocketProvider>
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

  // Vendor route handler component
  const VendorRouteHandler = () => {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const ref = searchParams.get('ref');
    
    // If there's a reference number, redirect to backend vendor portal
    if (ref) {
      window.location.href = `http://192.168.1.1:8000/vendor-portal?ref=${ref}`;
      return null;
    }
    
    // Otherwise, show the normal vendor portal (requires login)
    if (!user) {
      return <Navigate to="/" replace />;
    }
    
    const userType = user.userType || user.user_type;
    if (userType !== 'vendor') {
      return <Navigate to="/" replace />;
    }
    
    console.log('Vendor user data:', user);
    
    // Check if vendor has full access and approved registration - show full portal
    if (user.has_full_access && user.registration_status === 'approved') {
      return <VendorPortalFullAccess user={user} onLogout={onLogout} />;
    }
    
    // Check if vendor has basic access and approved registration - show basic portal
    if (user.registration_status === 'approved') {
      return <VendorPortal user={user} onLogout={onLogout} />;
    }
    
    // If NDA is completed but registration is not approved, show vendor registration form
    if (user.nda_status === 'completed' && user.registration_status !== 'approved') {
      return <VendorRegistrationFormWrapper user={user} onLogout={onLogout} />;
    }
    
    // Default: show vendor registration form for any other case
    return <VendorRegistrationFormWrapper user={user} onLogout={onLogout} />;
  };

  // Vendor Registration Form Wrapper Component
  const VendorRegistrationFormWrapper = ({ user, onLogout }) => {
    console.log('VendorRegistrationFormWrapper rendered');
    const [showRegistrationForm, setShowRegistrationForm] = useState(true);

    const handleRegistrationSubmit = async (formData) => {
      try {
        const response = await apiCall('/api/vendor/register', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
        
        if (response.success) {
          alert('Registration submitted successfully! You will receive an email once approved.');
          // Optionally redirect or update user state
        }
      } catch (error) {
        console.error('Failed to submit registration:', error);
        alert('Failed to submit registration. Please try again.');
      }
    };


    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-xl">Y</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">YellowStone XPs</h1>
                  <p className="text-sm text-gray-500">Vendor Registration</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl">
                  <span className="text-sm font-medium">{user?.company || user?.name}</span>
                </div>
                <button onClick={onLogout} className="p-2 text-gray-600 hover:bg-gray-100 rounded-xl">
                  <span className="text-lg">↩</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="text-center py-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Complete Your Vendor Registration</h2>
              <p className="text-gray-600 mb-6">
                Your NDA has been completed successfully. Please complete your vendor registration to get full access to our portal.
              </p>
              <button
                onClick={() => setShowRegistrationForm(true)}
                className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 font-medium shadow-md hover:shadow-lg transition-all duration-200"
              >
                Start Registration
              </button>
            </div>
          </div>
        </main>

        {/* Comprehensive Registration Form */}
        <ComprehensiveRegistrationForm
          isOpen={showRegistrationForm}
          onClose={() => setShowRegistrationForm(false)}
          onSubmit={handleRegistrationSubmit}
        />
      </div>
    );
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
      
      <Route path="/vendor" element={<VendorRouteHandler />} />
      
      {/* Vendor Registration route */}
      <Route path="/vendor-registration" element={
        <VendorRegistrationPage onLogin={onLogin} />
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
