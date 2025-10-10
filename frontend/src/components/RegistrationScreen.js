import React, { useState, useEffect } from 'react';
import { Lock, User, Building, AlertCircle, X, CheckCircle } from 'lucide-react';
import { apiCall } from '../utils/api';

const RegistrationScreen = ({ onBack, onLogin }) => {
  const [userType, setUserType] = useState('admin');
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    name: '',
    password: '',
    confirmPassword: '',
    employee_id: '',
    designation: '',
    department: '',
    manager: '',
    company_name: '',
    contact_person: '',
    phone: '',
    address: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [employeeFound, setEmployeeFound] = useState(false);
  const [employeeDetails, setEmployeeDetails] = useState(null);
  const [loadingEmployee, setLoadingEmployee] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Auto-populate employee details when employee_id changes
    if (name === 'employee_id' && userType === 'employee' && value.trim()) {
      handleEmployeeIdChange(value.trim());
    }
  };

  const handleEmployeeIdChange = async (employeeId) => {
    if (!employeeId) {
      setEmployeeFound(false);
      setEmployeeDetails(null);
      return;
    }

    setLoadingEmployee(true);
    setError('');

    try {
      console.log(`Fetching employee details for ID: ${employeeId}`);
      const response = await apiCall(`/api/auth/employee-details/${employeeId}`);
      console.log('API response:', response);
      
      if (response.success && response.employee) {
        console.log('Employee found:', response.employee);
        setEmployeeDetails(response.employee);
        setEmployeeFound(true);
        
        // Auto-populate form fields
        setFormData(prev => ({
          ...prev,
          name: response.employee.name || '',
          email: response.employee.email || '',
          designation: response.employee.designation || '',
          department: response.employee.department || '',
          manager: response.employee.manager || ''
        }));
      } else {
        console.log('Employee not found in response');
        setEmployeeFound(false);
        setEmployeeDetails(null);
        setError('Employee not found. Please check your Employee ID.');
      }
    } catch (err) {
      console.error('Error fetching employee details:', err);
      setEmployeeFound(false);
      setEmployeeDetails(null);
      setError('Failed to fetch employee details. Please try again.');
    } finally {
      setLoadingEmployee(false);
    }
  };

  const resetEmployeeData = () => {
    setEmployeeFound(false);
    setEmployeeDetails(null);
    setFormData(prev => ({
      ...prev,
      name: '',
      email: '',
      designation: '',
      department: '',
      manager: ''
    }));
  };

  const handleUserTypeChange = (type) => {
    setUserType(type);
    setError('');
    setSuccess('');
    if (type !== 'employee') {
      resetEmployeeData();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validation
    if (!formData.email || !formData.name || !formData.password) {
      setError('Email, name, and password are required');
      setLoading(false);
      return;
    }

    if (userType === 'admin' && !formData.username) {
      setError('Username is required for admin registration');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (userType === 'employee') {
      if (!formData.employee_id) {
        setError('Employee ID is required');
        setLoading(false);
        return;
      }
      if (!employeeFound) {
        setError('Please enter a valid Employee ID and wait for verification');
        setLoading(false);
        return;
      }
    }

    if (userType === 'vendor' && !formData.company_name) {
      setError('Company name is required');
      setLoading(false);
      return;
    }

    if (userType === 'vendor' && !formData.password) {
      setError('Password is required for vendor registration');
      setLoading(false);
      return;
    }

    try {
      let endpoint = '';
      let payload = {};

      if (userType === 'admin') {
        endpoint = '/api/auth/register-admin';
        payload = {
          email: formData.email,
          username: formData.username,
          full_name: formData.name,
          password: formData.password
        };
      } else if (userType === 'employee') {
        endpoint = '/api/auth/register-employee';
        payload = {
          email: formData.email,
          name: formData.name,
          employee_id: formData.employee_id,
          designation: formData.designation,
          department: formData.department,
          manager: formData.manager,
          password: formData.password
        };
      } else {
        endpoint = '/api/auth/register-vendor';
        payload = {
          email: formData.email,
          company_name: formData.company_name,
          contact_person: formData.contact_person,
          phone: formData.phone,
          address: formData.address,
          password: formData.password
        };
      }

      const response = await apiCall(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (response.success) {
        setSuccess(response.message);
        setTimeout(() => {
          onLogin();
        }, 2000);
      } else {
        setError(response.message || 'Registration failed');
      }
    } catch (err) {
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden relative z-10">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-8 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <span className="text-2xl font-bold">Y</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold">YellowStone XPs</h1>
                <p className="text-amber-100 text-sm">Create Account</p>
              </div>
            </div>
            <button
              onClick={onBack}
              className="text-white hover:text-amber-200 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Registration Form */}
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
                onClick={() => handleUserTypeChange(type.value)}
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

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700 text-sm">
              <AlertCircle size={16} />
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Common Fields - Only show for Admin and Vendor */}
            {(userType === 'admin' || userType === 'vendor') && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="Enter your email"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
              </div>
            )}

            {/* Admin Username Field */}
            {userType === 'admin' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Username *</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="Enter your username"
                  required
                />
              </div>
            )}

            {/* Password Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="Enter password"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password *</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="Confirm password"
                  required
                />
              </div>
            </div>

            {/* Employee Specific Fields */}
            {userType === 'employee' && (
              <div className="space-y-4">
                {/* Employee ID Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Employee ID *</label>
                  <div className="relative">
                    <input
                      type="text"
                      name="employee_id"
                      value={formData.employee_id}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="Enter employee ID"
                      required
                    />
                    {loadingEmployee && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-amber-500"></div>
                      </div>
                    )}
                    {employeeFound && !loadingEmployee && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      </div>
                    )}
                  </div>
                  {employeeFound && employeeDetails && (
                    <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-800">
                        <strong>Employee Found:</strong> {employeeDetails.name} - {employeeDetails.designation}
                      </p>
                    </div>
                  )}
                </div>

                {/* Auto-populated Employee Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-gray-50"
                      placeholder="Auto-populated from Employee ID"
                      required
                      readOnly={employeeFound}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-gray-50"
                      placeholder="Auto-populated from Employee ID"
                      required
                      readOnly={employeeFound}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Designation</label>
                    <input
                      type="text"
                      name="designation"
                      value={formData.designation}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-gray-50"
                      placeholder="Auto-populated from Employee ID"
                      readOnly={employeeFound}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                    <input
                      type="text"
                      name="department"
                      value={formData.department}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-gray-50"
                      placeholder="Auto-populated from Employee ID"
                      readOnly={employeeFound}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Manager</label>
                    <input
                      type="text"
                      name="manager"
                      value={formData.manager}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-gray-50"
                      placeholder="Auto-populated from Employee ID"
                      readOnly={employeeFound}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Vendor Specific Fields */}
            {userType === 'vendor' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company Name *</label>
                  <input
                    type="text"
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="Enter company name"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Contact Person</label>
                    <input
                      type="text"
                      name="contact_person"
                      value={formData.contact_person}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="Contact person name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="Phone number"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="Company address"
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg font-medium hover:from-amber-600 hover:to-orange-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>

            {/* Back to Login */}
            <div className="text-center mt-4">
              <button
                type="button"
                onClick={onBack}
                className="text-amber-600 hover:text-amber-700 font-medium"
              >
                ← Back to Login
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegistrationScreen;
