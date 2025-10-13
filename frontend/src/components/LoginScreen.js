import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Building, AlertCircle } from 'lucide-react';
import { apiCall } from '../utils/api';

const LoginScreen = ({ onLogin, onRegister }) => {
  const [userType, setUserType] = useState('admin');
  const [credentials, setCredentials] = useState({ username: '', password: '', employeeId: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    
    try {
      let endpoint = '';
      let body = {};
      
      if (userType === 'admin') {
        endpoint = '/api/auth/admin-login';
        body = { username: credentials.username, password: credentials.password };
      } else if (userType === 'employee') {
        endpoint = '/api/auth/employee-login-by-id';
        body = { employee_id: credentials.employeeId, password: credentials.password };
      } else {
        endpoint = '/api/auth/vendor-login';
        body = { email: credentials.username, password: credentials.password };
      }
      
      console.log('Login attempt:', { userType, endpoint, body });
      
      const response = await apiCall(endpoint, {
        method: 'POST',
        body: JSON.stringify(body)
      });
      
      console.log('Login response:', response);
      
      if (response.success) {
        onLogin({ ...response.user, userType });
        // Redirect to the appropriate route after successful login
        navigate(`/${userType}`);
      } else {
        setError(response.message || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative z-10">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-8 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <span className="text-2xl font-bold">Y</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold">YellowStone XPs</h1>
              <p className="text-amber-100 text-sm">Management Portal</p>
            </div>
          </div>
        </div>

        {/* Login Form */}
        <div className="p-8">
          {/* User Type Selector */}
          <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-lg">
            {[
              { value: 'admin', label: 'Admin', icon: Lock },
              { value: 'employee', label: 'Employee', icon: User },
              { value: 'vendor', label: 'Vendor', icon: Building }
            ].map(type => (
              <button
                key={type.value}
                onClick={() => setUserType(type.value)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md transition-all ${
                  userType === type.value 
                    ? 'bg-white text-amber-600 shadow-sm font-medium' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <type.icon size={16} />
                <span className="text-sm">{type.label}</span>
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {/* Input Fields */}
          <div className="space-y-4">
            {userType === 'employee' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Employee ID</label>
                <input
                  type="text"
                  value={credentials.employeeId}
                  onChange={(e) => setCredentials({...credentials, employeeId: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="Enter your employee ID"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {userType === 'vendor' ? 'Email Address' : 'Username'}
                </label>
                <input
                  type={userType === 'vendor' ? 'email' : 'text'}
                  value={credentials.username}
                  onChange={(e) => setCredentials({...credentials, username: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder={userType === 'vendor' ? 'vendor@company.com' : 'Enter your username'}
                />
              </div>
            )}

            {userType !== 'vendor' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  value={credentials.password}
                  onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="Enter your password"
                />
              </div>
            )}

            {userType === 'vendor' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  value={credentials.password}
                  onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="Enter your password"
                />
              </div>
            )}
          </div>

          {/* Login Button */}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full mt-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg font-medium hover:from-amber-600 hover:to-orange-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          {/* Registration Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 mb-2">Don't have an account?</p>
            <button
              onClick={() => navigate('/register')}
              className="text-amber-600 hover:text-amber-700 font-medium"
            >
              Create Account →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
