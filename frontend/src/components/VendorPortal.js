import React, { useState, useEffect } from 'react';
import { 
  LogOut, Home, Package, ClipboardList, FileCheck, Building,
  AlertCircle, CheckCircle, UserPlus, Clock, ArrowRight, Mail, Phone, MapPin
} from 'lucide-react';
import { apiCall } from '../utils/api';
import StatsCard from './StatsCard';

const VendorPortal = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [ndaStatus, setNdaStatus] = useState('completed');
  const [registrationStatus, setRegistrationStatus] = useState('pending');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [registrationForm, setRegistrationForm] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    businessType: '',
    services: '',
    experience: '',
    certifications: '',
    references: ''
  });

  useEffect(() => {
    loadVendorData();
  }, []);

  const loadVendorData = async () => {
    try {
      setLoading(true);
      const data = await apiCall('/api/vendor/dashboard-data');
      setNdaStatus(data.ndaStatus || 'completed');
      setRegistrationStatus(data.registrationStatus || 'pending');
    } catch (error) {
      console.error('Failed to load vendor data:', error);
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
        setRegistrationStatus('submitted');
        setShowRegistrationForm(false);
        alert('Registration submitted successfully! You will receive an email once approved.');
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center">
                <Building className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Vendor Portal</h1>
                <p className="text-sm text-gray-500">Welcome, {user.name || user.company}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl">
                <span className="text-sm font-medium">{user.company || user.name}</span>
              </div>
              <button onClick={onLogout} className="p-2 text-gray-600 hover:bg-gray-100 rounded-xl">
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-6">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: Home },
              { id: 'registration', label: 'Registration', icon: UserPlus },
              { id: 'nda', label: 'NDA Status', icon: FileCheck }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <tab.icon size={20} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Welcome Message */}
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
              <h2 className="text-2xl font-bold mb-2">Welcome to YellowStone XPs Vendor Portal</h2>
              <p className="text-purple-100">Your NDA has been completed successfully. Complete your registration to get full access.</p>
            </div>

            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatsCard
                icon={CheckCircle}
                title="NDA Status"
                value="COMPLETED"
                color="bg-gradient-to-br from-green-500 to-green-600"
              />
              <StatsCard
                icon={Clock}
                title="Registration"
                value={registrationStatus.toUpperCase()}
                color={registrationStatus === 'approved' ? 'bg-gradient-to-br from-green-500 to-green-600' : 'bg-gradient-to-br from-amber-500 to-amber-600'}
              />
              <StatsCard
                icon={Package}
                title="Portal Access"
                value={registrationStatus === 'approved' ? 'FULL' : 'LIMITED'}
                color={registrationStatus === 'approved' ? 'bg-gradient-to-br from-green-500 to-green-600' : 'bg-gradient-to-br from-red-500 to-red-600'}
              />
            </div>

            {/* Next Steps */}
            {registrationStatus === 'pending' && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <ArrowRight className="text-white" size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Next Steps</h3>
                    <p className="text-gray-600 mb-4">
                      Your NDA has been completed successfully! To get full access to our vendor portal, 
                      please complete your vendor registration form.
                    </p>
                    <button
                      onClick={() => setShowRegistrationForm(true)}
                      className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 font-medium"
                    >
                      Complete Registration
                    </button>
                  </div>
                </div>
              </div>
            )}

            {registrationStatus === 'submitted' && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <Clock className="text-amber-600 flex-shrink-0" size={24} />
                  <div>
                    <h3 className="font-bold text-amber-900 mb-2">Registration Under Review</h3>
                    <p className="text-amber-700 text-sm mb-4">
                      Your registration has been submitted and is currently under review by our team. 
                      You'll receive an email notification once approved.
                    </p>
                    <p className="text-amber-700 text-sm">
                      <strong>Expected Review Time:</strong> 2-3 business days
                    </p>
                  </div>
                </div>
              </div>
            )}

            {registrationStatus === 'approved' && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <CheckCircle className="text-green-600 flex-shrink-0" size={24} />
                  <div>
                    <h3 className="font-bold text-green-900 mb-2">Registration Approved!</h3>
                    <p className="text-green-700 text-sm mb-4">
                      Congratulations! Your registration has been approved. You now have full access to our vendor portal.
                    </p>
                    <div className="flex gap-3">
                      <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium">
                        View Services
                      </button>
                      <button className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 text-sm font-medium">
                        Check Orders
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <CheckCircle className="text-green-500" size={20} />
                  <div className="flex-1">
                    <p className="font-medium">NDA Completed</p>
                    <p className="text-sm text-gray-500">Your NDA has been successfully completed and approved</p>
                  </div>
                  <span className="text-sm text-gray-500">2 days ago</span>
                </div>
                {registrationStatus === 'submitted' && (
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                    <UserPlus className="text-blue-500" size={20} />
                    <div className="flex-1">
                      <p className="font-medium">Registration Submitted</p>
                      <p className="text-sm text-gray-500">Your vendor registration has been submitted for review</p>
                    </div>
                    <span className="text-sm text-gray-500">1 day ago</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'registration' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Vendor Registration</h2>
              {registrationStatus === 'pending' && (
                <button
                  onClick={() => setShowRegistrationForm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
                >
                  <UserPlus size={20} />
                  Complete Registration
                </button>
              )}
            </div>

            {registrationStatus === 'pending' && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="text-center py-12">
                  <UserPlus className="mx-auto text-gray-300 mb-4" size={48} />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Complete Your Registration</h3>
                  <p className="text-gray-600 mb-6">
                    Fill out the vendor registration form to get full access to our portal
                  </p>
                  <button
                    onClick={() => setShowRegistrationForm(true)}
                    className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 font-medium"
                  >
                    Start Registration
                  </button>
                </div>
              </div>
            )}

            {registrationStatus === 'submitted' && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="text-center py-12">
                  <Clock className="mx-auto text-amber-500 mb-4" size={48} />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Registration Under Review</h3>
                  <p className="text-gray-600 mb-6">
                    Your registration has been submitted and is currently under review
                  </p>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 max-w-md mx-auto">
                    <p className="text-sm text-amber-800">
                      <strong>Status:</strong> Under Review<br/>
                      <strong>Expected Time:</strong> 2-3 business days<br/>
                      <strong>Contact:</strong> vendor-support@yellowstonexps.com
                    </p>
                  </div>
                </div>
              </div>
            )}

            {registrationStatus === 'approved' && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="text-center py-12">
                  <CheckCircle className="mx-auto text-green-500 mb-4" size={48} />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Registration Approved!</h3>
                  <p className="text-gray-600 mb-6">
                    Congratulations! Your registration has been approved
                  </p>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-md mx-auto">
                    <p className="text-sm text-green-800">
                      <strong>Status:</strong> Approved<br/>
                      <strong>Access Level:</strong> Full Portal Access<br/>
                      <strong>Approved On:</strong> {new Date().toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'nda' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">NDA Status</h2>
            
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="text-green-600" size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-1">Status: COMPLETED</h3>
                  <p className="text-gray-600">
                    Your NDA has been successfully completed and approved
                  </p>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800">
                  <strong>NDA Details:</strong><br/>
                  • Agreement Type: Non-Disclosure Agreement<br/>
                  • Status: Completed and Approved<br/>
                  • Completion Date: {new Date().toLocaleDateString()}<br/>
                  • Reference Number: NDA-{Math.random().toString(36).substr(2, 9).toUpperCase()}
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Registration Form Modal */}
      {showRegistrationForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">Vendor Registration Form</h3>
                <button
                  onClick={() => setShowRegistrationForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company Name *</label>
                  <input
                    type="text"
                    value={registrationForm.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter company name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contact Person *</label>
                  <input
                    type="text"
                    value={registrationForm.contactPerson}
                    onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter contact person name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                  <input
                    type="email"
                    value={registrationForm.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
                  <input
                    type="tel"
                    value={registrationForm.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter phone number"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address *</label>
                <textarea
                  value={registrationForm.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter company address"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Business Type *</label>
                  <select
                    value={registrationForm.businessType}
                    onChange={(e) => handleInputChange('businessType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Select business type</option>
                    <option value="IT Services">IT Services</option>
                    <option value="Consulting">Consulting</option>
                    <option value="Manufacturing">Manufacturing</option>
                    <option value="Logistics">Logistics</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Years of Experience *</label>
                  <select
                    value={registrationForm.experience}
                    onChange={(e) => handleInputChange('experience', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Select experience</option>
                    <option value="1-2 years">1-2 years</option>
                    <option value="3-5 years">3-5 years</option>
                    <option value="6-10 years">6-10 years</option>
                    <option value="10+ years">10+ years</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Services Offered *</label>
                <textarea
                  value={registrationForm.services}
                  onChange={(e) => handleInputChange('services', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Describe the services you offer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Certifications</label>
                <textarea
                  value={registrationForm.certifications}
                  onChange={(e) => handleInputChange('certifications', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="List any relevant certifications"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">References</label>
                <textarea
                  value={registrationForm.references}
                  onChange={(e) => handleInputChange('references', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Provide references from previous clients"
                />
              </div>
            </div>
            
            <div className="p-6 border-t flex justify-end gap-3">
              <button
                onClick={() => setShowRegistrationForm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleRegistrationSubmit}
                className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 font-medium"
              >
                Submit Registration
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorPortal;