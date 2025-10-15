import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building, Lock, ArrowLeft, AlertCircle } from 'lucide-react';
import { apiCall } from '../utils/api';
import ComprehensiveRegistrationForm from './ComprehensiveRegistrationForm';

const VendorRegistrationPage = ({ onLogin }) => {
  const [showLoginForm, setShowLoginForm] = useState(true);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [registrationForm, setRegistrationForm] = useState({
    companyName: '',
    contactPersonName: '',
    emailAddress: '',
    phoneNumber: '',
    address: '',
    businessType: '',
    taxId: '',
    website: '',
    description: '',
    capabilities: '',
    certifications: '',
    references: '',
    ndaStatus: '',
    referenceNumber: ''
  });
  const navigate = useNavigate();

  const handleTemporaryLogin = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await apiCall('/api/auth/temporary-login', {
        method: 'POST',
        body: JSON.stringify(credentials)
      });
      
      if (response.success) {
        setUser(response.user);
        setRegistrationForm(prev => ({
          ...prev,
          companyName: response.user.company || '',
          contactPersonName: response.user.contact_person || '',
          emailAddress: response.user.email || '',
          ndaStatus: response.user.nda_status || '',
          referenceNumber: response.user.reference_number || ''
        }));
        setShowLoginForm(false);
        setShowDashboard(true);
        onLogin(response.user);
      } else {
        setError(response.message || 'Login failed');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegistrationSubmit = async () => {
    try {
      const response = await apiCall('/api/vendor/register', {
        method: 'POST',
        body: JSON.stringify(registrationForm)
      });
      
      if (response.success) {
        alert('Registration submitted successfully! You will receive an email once approved.');
        navigate('/');
      }
    } catch (error) {
      console.error('Failed to submit registration:', error);
      alert('Failed to submit registration. Please try again.');
    }
  };

  const handleInputChange = (field, value) => {
    setRegistrationForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Registration Dashboard Component
  const RegistrationDashboard = () => (
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
                <p className="text-sm text-gray-500">Vendor Registration Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl">
                <span className="text-sm font-medium">{user?.company}</span>
              </div>
              <button onClick={() => navigate('/')} className="p-2 text-gray-600 hover:bg-gray-100 rounded-xl">
                <ArrowLeft size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* NDA Status Card */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Building className="w-5 h-5 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">NDA Status</h2>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-green-800">Completed</span>
                </div>
                <div className="space-y-2 text-sm text-green-700">
                  <p><strong>Reference Number:</strong> {user?.reference_number}</p>
                  <p><strong>Company:</strong> {user?.company}</p>
                  <p><strong>Contact Person:</strong> {user?.contact_person}</p>
                  <p><strong>Email:</strong> {user?.email}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Registration Status Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Lock className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Registration</h2>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm font-medium text-yellow-800">Pending</span>
                </div>
                <p className="text-sm text-yellow-700">
                  Complete your vendor registration to get full portal access.
                </p>
              </div>

              <button
                onClick={() => setShowRegistrationForm(true)}
                className="w-full px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 font-medium shadow-md hover:shadow-lg transition-all duration-200"
              >
                Start Registration Form
              </button>
            </div>
          </div>

          {/* Progress Overview */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Registration Progress</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-white text-sm font-bold">✓</span>
                  </div>
                  <h4 className="font-medium text-gray-900">NDA Completed</h4>
                  <p className="text-sm text-gray-600">Non-disclosure agreement signed</p>
                </div>
                
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-white text-sm font-bold">!</span>
                  </div>
                  <h4 className="font-medium text-gray-900">Registration Pending</h4>
                  <p className="text-sm text-gray-600">Complete vendor details</p>
                </div>
                
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-gray-600 text-sm font-bold">⏳</span>
                  </div>
                  <h4 className="font-medium text-gray-900">Admin Approval</h4>
                  <p className="text-sm text-gray-600">Awaiting review</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Comprehensive Registration Form */}
      <ComprehensiveRegistrationForm
        isOpen={showRegistrationForm}
        onClose={() => setShowRegistrationForm(false)}
        onSubmit={handleRegistrationSubmit}
        formData={registrationForm}
        onInputChange={handleInputChange}
      />
    </div>
  );

  if (!showLoginForm && user && showDashboard) {
    return <RegistrationDashboard />;
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative z-10">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-8 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Building size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Vendor Registration</h1>
              <p className="text-blue-100 text-sm">Temporary Login</p>
            </div>
          </div>
        </div>

        {/* Login Form */}
        <div className="p-8">
          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-4 text-center">
              Enter your temporary credentials from the NDA completion email
            </p>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    value={credentials.email}
                    onChange={(e) => setCredentials({...credentials, email: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Temporary Password</label>
                <div className="relative">
                  <input
                    type="password"
                    value={credentials.password}
                    onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your temporary password"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Login Button */}
          <button
            onClick={handleTemporaryLogin}
            disabled={loading}
            className="w-full mt-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-indigo-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Access Registration Form'}
          </button>

          {/* Back to Login */}
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/')}
              className="text-blue-600 hover:text-blue-700 font-medium flex items-center justify-center gap-2"
            >
              <ArrowLeft size={16} />
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorRegistrationPage;
