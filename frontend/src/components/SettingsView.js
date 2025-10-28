import React, { useState, useEffect } from 'react';
import { 
  Building, Mail, Shield, Bell, Database, Users, Key, 
  Save, RefreshCw, Eye, EyeOff, Upload, Download, 
  Globe, Lock, AlertTriangle, CheckCircle, X
} from 'lucide-react';
import { apiCall } from '../utils/api';

const SettingsView = ({ showNotification }) => {
  const [activeTab, setActiveTab] = useState('company');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPasswords, setShowPasswords] = useState({});
  
  // Settings state
  const [settings, setSettings] = useState({
    company: {
      name: 'YellowStone Xperiences Pvt Ltd',
      registrationNumber: 'U72900PB2020PTC051260',
      address: 'Plot # 2, ITC, Fourth Floor, Sector 67, Mohali -160062, Punjab, India',
      phone: '+91-XXXX-XXXXXX',
      email: 'info@yellowstonexps.com',
      website: 'https://yellowstonexps.com',
      logo: null
    },
    email: {
      smtpServer: 'smtp.gmail.com',
      smtpPort: '587',
      username: 'noreply@yellowstonexps.com',
      password: '••••••••••••',
      fromName: 'YellowStone XPs',
      replyTo: 'support@yellowstonexps.com',
      testEmail: ''
    },
    security: {
      sessionTimeout: 30,
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true
      },
      twoFactorAuth: false,
      ipWhitelist: [],
      loginAttempts: 5
    },
    notifications: {
      emailNotifications: true,
      systemAlerts: true,
      vendorUpdates: true,
      ndaSubmissions: true,
      weeklyReports: true,
      maintenanceAlerts: true
    },
    system: {
      timezone: 'Asia/Kolkata',
      dateFormat: 'DD/MM/YYYY',
      language: 'en',
      theme: 'light',
      autoBackup: true,
      backupFrequency: 'daily',
      logRetention: 90
    },
    integrations: {
      googleDrive: false,
      dropbox: false,
      slack: false,
      webhookUrl: '',
      apiKey: '••••••••••••'
    }
  });

  const [originalSettings, setOriginalSettings] = useState({});

  // Employee access state
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    loadSettings();
    loadEmployeeAccess();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await apiCall('/api/admin/settings');
      
      if (data.success && data.settings) {
        const loadedSettings = {
          company: {
            name: data.settings.company?.company_name || 'YellowStone Xps',
            registrationNumber: data.settings.company?.company_registration || 'U72900PB2020PTC051260',
            address: data.settings.company?.company_address || '',
            phone: data.settings.company?.company_phone || '',
            email: data.settings.company?.company_email || '',
            website: data.settings.company?.company_website || '',
            logo: null
          },
          email: {
            smtpServer: data.settings.email?.smtp_server || 'smtp.gmail.com',
            smtpPort: data.settings.email?.smtp_port || '587',
            username: data.settings.email?.smtp_username || '',
            password: data.settings.email?.smtp_password || '',
            fromName: data.settings.email?.from_name || 'YellowStone XPs',
            replyTo: data.settings.email?.reply_to || '',
            testEmail: ''
          },
          security: settings.security,
          notifications: settings.notifications,
          system: settings.system,
          integrations: settings.integrations
        };
        
        setSettings(loadedSettings);
        setOriginalSettings(JSON.parse(JSON.stringify(loadedSettings)));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      showNotification('Failed to load settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      
      // Prepare settings for API
      const settingsToSave = {
        company: {
          company_name: settings.company.name,
          company_registration: settings.company.registrationNumber,
          company_address: settings.company.address,
          company_phone: settings.company.phone,
          company_email: settings.company.email,
          company_website: settings.company.website
        },
        email: {
          smtp_server: settings.email.smtpServer,
          smtp_port: settings.email.smtpPort,
          smtp_username: settings.email.username,
          smtp_password: settings.email.password,
          from_name: settings.email.fromName,
          reply_to: settings.email.replyTo
        },
        security: settings.security,
        notifications: settings.notifications,
        system: settings.system,
        integrations: settings.integrations
      };
      
      await apiCall('/api/admin/settings', {
        method: 'PUT',
        body: JSON.stringify({ settings: settingsToSave })
      });
      
      setOriginalSettings(JSON.parse(JSON.stringify(settings)));
      showNotification('Settings saved successfully', 'success');
    } catch (error) {
      console.error('Error saving settings:', error);
      showNotification('Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const resetSettings = () => {
    setSettings(JSON.parse(JSON.stringify(originalSettings)));
    showNotification('Settings reset to last saved state', 'info');
  };

  const hasChanges = () => {
    return JSON.stringify(settings) !== JSON.stringify(originalSettings);
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const testEmailConnection = async () => {
    try {
      setLoading(true);
      console.log('Test email value:', settings.email.testEmail);
      if (!settings.email.testEmail || settings.email.testEmail.trim() === '') {
        showNotification('Please enter a test email address first', 'error');
        setLoading(false);
        return;
      }
      await apiCall('/api/admin/settings/test-email', {
        method: 'POST',
        body: JSON.stringify({ email: settings.email.testEmail })
      });
      showNotification('Test email sent successfully', 'success');
      setSettings(prev => ({
        ...prev,
        email: { ...prev.email, testEmail: '' }
      }));
    } catch (error) {
      showNotification('Email test failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Employee Access Functions
  const loadEmployeeAccess = async () => {
    try {
      const data = await apiCall('/api/admin/employee-access');
      if (data.success && data.employees) {
        setEmployees(data.employees);
      }
    } catch (error) {
      console.error('Error loading employee access:', error);
      showNotification('Failed to load employee access', 'error');
    }
  };

  const updateEmployeeAccess = async (employeeId, accessType, hasAccess) => {
    try {
      await apiCall(`/api/admin/employee-access/${employeeId}`, {
        method: 'PUT',
        body: JSON.stringify({
          access_type: accessType,
          has_access: hasAccess
        })
      });
      
      // Update local state
      setEmployees(prevEmployees =>
        prevEmployees.map(emp =>
          emp.id === employeeId
            ? { ...emp, access: { ...emp.access, [accessType]: hasAccess } }
            : emp
        )
      );
      
      // Update selected employee if it's the same
      if (selectedEmployee && selectedEmployee.id === employeeId) {
        setSelectedEmployee({
          ...selectedEmployee,
          access: { ...selectedEmployee.access, [accessType]: hasAccess }
        });
      }
      
      showNotification('Access updated successfully', 'success');
    } catch (error) {
      console.error('Error updating employee access:', error);
      showNotification('Failed to update employee access', 'error');
    }
  };

  const searchEmployee = async () => {
    if (!selectedEmployeeId.trim()) {
      showNotification('Please enter an employee ID', 'error');
      return;
    }

    setSearching(true);
    try {
      const data = await apiCall('/api/admin/employee-access');
      if (data.success && data.employees) {
        const employee = data.employees.find(
          emp => emp.employee_id === selectedEmployeeId.trim() || emp.id.toString() === selectedEmployeeId.trim()
        );
        
        if (employee) {
          setSelectedEmployee(employee);
          setSearchTerm(selectedEmployeeId.trim());
        } else {
          showNotification('Employee not found', 'error');
          setSelectedEmployee(null);
        }
      }
    } catch (error) {
      console.error('Error searching employee:', error);
      showNotification('Failed to search employee', 'error');
    } finally {
      setSearching(false);
    }
  };

  const grantAccess = async (accessType) => {
    if (!selectedEmployee) {
      showNotification('Please select an employee first', 'error');
      return;
    }

    try {
      await updateEmployeeAccess(selectedEmployee.id, accessType, true);
    } catch (error) {
      console.error('Error granting access:', error);
      showNotification('Failed to grant access', 'error');
    }
  };

  const handleRemoveSingleAccess = async (employeeId, employeeName, accessType, accessTypeName) => {
    if (!window.confirm(`Are you sure you want to remove ${accessTypeName} access from ${employeeName}?`)) {
      return;
    }

    try {
      await updateEmployeeAccess(employeeId, accessType, false);
      showNotification(`${accessTypeName} access removed from ${employeeName}`, 'success');
      loadEmployeeAccess();
    } catch (error) {
      console.error('Error removing access:', error);
      showNotification('Failed to remove access', 'error');
    }
  };

  const handleRemoveAllAccess = async (employeeId, employeeName) => {
    if (!window.confirm(`Are you sure you want to remove all access permissions from ${employeeName}?`)) {
      return;
    }

    try {
      // Remove each access type
      if (employees.find(emp => emp.id === employeeId)?.access?.send_nda) {
        await updateEmployeeAccess(employeeId, 'send_nda', false);
      }
      if (employees.find(emp => emp.id === employeeId)?.access?.send_leads) {
        await updateEmployeeAccess(employeeId, 'send_leads', false);
      }
      if (employees.find(emp => emp.id === employeeId)?.access?.hr_access) {
        await updateEmployeeAccess(employeeId, 'hr_access', false);
      }
      
      showNotification(`All access permissions removed from ${employeeName}`, 'success');
      
      // Reload the employee access list to reflect changes
      loadEmployeeAccess();
    } catch (error) {
      console.error('Error removing access:', error);
      showNotification('Failed to remove access', 'error');
    }
  };

  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'yellowstone-settings.json';
    link.click();
    URL.revokeObjectURL(url);
    showNotification('Settings exported successfully', 'success');
  };

  const importSettings = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedSettings = JSON.parse(e.target.result);
          setSettings(importedSettings);
          showNotification('Settings imported successfully', 'success');
        } catch (error) {
          showNotification('Invalid settings file', 'error');
        }
      };
      reader.readAsText(file);
    }
  };

  const settingsTabs = [
    { id: 'company', label: 'Company Profile', icon: Building },
    { id: 'email', label: 'Email Configuration', icon: Mail },
    { id: 'access', label: 'Employee Access', icon: Users },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'system', label: 'System Preferences', icon: Database },
    { id: 'integrations', label: 'Integrations', icon: Globe }
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">System Settings</h2>
          <p className="text-gray-600 mt-1">Configure your YellowStone XPs admin portal</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportSettings}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Download size={16} />
            Export
          </button>
          <label className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">
            <Upload size={16} />
            Import
            <input
              type="file"
              accept=".json"
              onChange={importSettings}
              className="hidden"
            />
          </label>
          <button
            onClick={resetSettings}
            disabled={!hasChanges()}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw size={16} />
            Reset
          </button>
          <button
            onClick={saveSettings}
            disabled={!hasChanges() || saving}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Save size={16} />
            )}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Settings Tabs */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            {settingsTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-amber-500 text-amber-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Company Profile Settings */}
          {activeTab === 'company' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                  <input
                    type="text"
                    value={settings.company.name}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      company: { ...prev.company, name: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Registration Number</label>
                  <input
                    type="text"
                    value={settings.company.registrationNumber}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      company: { ...prev.company, registrationNumber: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company Address</label>
                <textarea
                  value={settings.company.address}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    company: { ...prev.company, address: e.target.value }
                  }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={settings.company.phone}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      company: { ...prev.company, phone: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    value={settings.company.email}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      company: { ...prev.company, email: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                  <input
                    type="url"
                    value={settings.company.website}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      company: { ...prev.company, website: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company Logo</label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Building className="text-gray-400" size={32} />
                  </div>
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
                    />
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 2MB</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Email Configuration Settings */}
          {activeTab === 'email' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Server</label>
                  <input
                    type="text"
                    value={settings.email.smtpServer}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      email: { ...prev.email, smtpServer: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Port</label>
                  <input
                    type="number"
                    value={settings.email.smtpPort}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      email: { ...prev.email, smtpPort: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                  <input
                    type="text"
                    value={settings.email.username}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      email: { ...prev.email, username: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                  <div className="relative">
                    <input
                      type={showPasswords.emailPassword ? 'text' : 'password'}
                      value={settings.email.password}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        email: { ...prev.email, password: e.target.value }
                      }))}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('emailPassword')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPasswords.emailPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">From Name</label>
                  <input
                    type="text"
                    value={settings.email.fromName}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      email: { ...prev.email, fromName: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reply-To Email</label>
                  <input
                    type="email"
                    value={settings.email.replyTo}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      email: { ...prev.email, replyTo: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="text-blue-600" size={16} />
                  <h3 className="font-medium text-blue-900">Test Email Configuration</h3>
                </div>
                <div className="flex gap-3">
                  <input
                    type="email"
                    placeholder="Enter test email address"
                    value={settings.email.testEmail}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      email: { ...prev.email, testEmail: e.target.value }
                    }))}
                    className="flex-1 px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={testEmailConnection}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Send Test
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Employee Access Control */}
          {activeTab === 'access' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Employee Access Management</h2>
                  <p className="text-sm text-gray-600 mt-1">Grant specific access permissions to employees</p>
                </div>
              </div>

              {/* Employee Search */}
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Enter Employee ID</label>
                    <input
                      type="text"
                      placeholder="Employee ID or Employee Code"
                      value={selectedEmployeeId}
                      onChange={(e) => setSelectedEmployeeId(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && searchEmployee()}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={searchEmployee}
                      disabled={searching || !selectedEmployeeId.trim()}
                      className="px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {searching ? 'Searching...' : 'Search'}
                    </button>
                  </div>
                </div>

                {/* Selected Employee Info */}
                {selectedEmployee && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{selectedEmployee.name}</h3>
                        <p className="text-sm text-gray-600">{selectedEmployee.email}</p>
                        {selectedEmployee.employee_code && (
                          <p className="text-xs text-gray-500">ID: {selectedEmployee.employee_code}</p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedEmployee.access?.send_nda && (
                          <span className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full">NDA Access</span>
                        )}
                        {selectedEmployee.access?.send_leads && (
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Leads Access</span>
                        )}
                        {selectedEmployee.access?.hr_access && (
                          <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">HR Access</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Access Grant Buttons */}
              {selectedEmployee && (
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Grant Access Permissions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* NDA Access */}
                    <div className="border border-gray-200 rounded-lg p-4 hover:border-amber-500 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900">NDA Access</h4>
                          <p className="text-xs text-gray-500 mt-1">Send & view NDA forms</p>
                        </div>
                        {selectedEmployee.access?.send_nda ? (
                          <CheckCircle className="text-green-500" size={24} />
                        ) : (
                          <Lock className="text-gray-400" size={24} />
                        )}
                      </div>
                      <button
                        onClick={() => grantAccess('send_nda')}
                        disabled={selectedEmployee.access?.send_nda}
                        className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {selectedEmployee.access?.send_nda ? 'Already Granted' : 'Grant NDA Access'}
                      </button>
                    </div>

                    {/* Lead Generation Access */}
                    <div className="border border-gray-200 rounded-lg p-4 hover:border-amber-500 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900">Lead Generation Access</h4>
                          <p className="text-xs text-gray-500 mt-1">Create, send & manage leads</p>
                        </div>
                        {selectedEmployee.access?.send_leads ? (
                          <CheckCircle className="text-green-500" size={24} />
                        ) : (
                          <Lock className="text-gray-400" size={24} />
                        )}
                      </div>
                      <button
                        onClick={() => grantAccess('send_leads')}
                        disabled={selectedEmployee.access?.send_leads}
                        className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {selectedEmployee.access?.send_leads ? 'Already Granted' : 'Grant Leads Access'}
                      </button>
                    </div>

                    {/* HR Access */}
                    <div className="border border-gray-200 rounded-lg p-4 hover:border-amber-500 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900">HR Access</h4>
                          <p className="text-xs text-gray-500 mt-1">Manage employees & attendance</p>
                        </div>
                        {selectedEmployee.access?.hr_access ? (
                          <CheckCircle className="text-green-500" size={24} />
                        ) : (
                          <Lock className="text-gray-400" size={24} />
                        )}
                      </div>
                      <button
                        onClick={() => grantAccess('hr_access')}
                        disabled={selectedEmployee.access?.hr_access}
                        className="w-full px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {selectedEmployee.access?.hr_access ? 'Already Granted' : 'Grant HR Access'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* All Employees with Access - Table View */}
              {employees.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">All Employees with Special Access</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">NDA</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Leads</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">HR</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {employees
                          .filter(emp => emp.access?.send_nda || emp.access?.send_leads || emp.access?.hr_access)
                          .map((employee) => (
                            <tr key={employee.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4">
                                <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                                <div className="text-xs text-gray-500">{employee.email}</div>
                              </td>
                              <td className="px-6 py-4 text-center">
                                {employee.access?.send_nda ? (
                                  <div className="flex flex-col items-center gap-1">
                                    <CheckCircle className="text-green-500" size={20} />
                                    <button
                                      onClick={() => handleRemoveSingleAccess(employee.id, employee.name, 'send_nda', 'NDA')}
                                      className="text-xs text-red-600 hover:text-red-800 font-medium"
                                      title="Remove NDA access"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-gray-400">—</span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-center">
                                {employee.access?.send_leads ? (
                                  <div className="flex flex-col items-center gap-1">
                                    <CheckCircle className="text-green-500" size={20} />
                                    <button
                                      onClick={() => handleRemoveSingleAccess(employee.id, employee.name, 'send_leads', 'Leads')}
                                      className="text-xs text-red-600 hover:text-red-800 font-medium"
                                      title="Remove Leads access"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-gray-400">—</span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-center">
                                {employee.access?.hr_access ? (
                                  <div className="flex flex-col items-center gap-1">
                                    <CheckCircle className="text-green-500" size={20} />
                                    <button
                                      onClick={() => handleRemoveSingleAccess(employee.id, employee.name, 'hr_access', 'HR')}
                                      className="text-xs text-red-600 hover:text-red-800 font-medium"
                                      title="Remove HR access"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-gray-400">—</span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <button
                                  onClick={() => handleRemoveAllAccess(employee.id, employee.name)}
                                  className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                                  title="Remove all access permissions"
                                >
                                  <X size={14} className="mr-1" />
                                  Remove All
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Old Security Settings - Keeping for reference but not accessible */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Session Timeout (minutes)</label>
                  <input
                    type="number"
                    value={settings.security.sessionTimeout}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      security: { ...prev.security, sessionTimeout: parseInt(e.target.value) }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Login Attempts</label>
                  <input
                    type="number"
                    value={settings.security.loginAttempts}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      security: { ...prev.security, loginAttempts: parseInt(e.target.value) }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Password Policy</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Length</label>
                    <input
                      type="number"
                      value={settings.security.passwordPolicy.minLength}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        security: {
                          ...prev.security,
                          passwordPolicy: {
                            ...prev.security.passwordPolicy,
                            minLength: parseInt(e.target.value)
                          }
                        }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.security.passwordPolicy.requireUppercase}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          security: {
                            ...prev.security,
                            passwordPolicy: {
                              ...prev.security.passwordPolicy,
                              requireUppercase: e.target.checked
                            }
                          }
                        }))}
                        className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Require Uppercase</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.security.passwordPolicy.requireLowercase}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          security: {
                            ...prev.security,
                            passwordPolicy: {
                              ...prev.security.passwordPolicy,
                              requireLowercase: e.target.checked
                            }
                          }
                        }))}
                        className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Require Lowercase</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.security.passwordPolicy.requireNumbers}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          security: {
                            ...prev.security,
                            passwordPolicy: {
                              ...prev.security.passwordPolicy,
                              requireNumbers: e.target.checked
                            }
                          }
                        }))}
                        className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Require Numbers</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.security.passwordPolicy.requireSpecialChars}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          security: {
                            ...prev.security,
                            passwordPolicy: {
                              ...prev.security.passwordPolicy,
                              requireSpecialChars: e.target.checked
                            }
                          }
                        }))}
                        className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Require Special Characters</span>
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Two-Factor Authentication</h3>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.security.twoFactorAuth}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      security: { ...prev.security, twoFactorAuth: e.target.checked }
                    }))}
                    className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Enable 2FA for all admin accounts</span>
                </label>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">IP Whitelist</h3>
                <div className="space-y-2">
                  {settings.security.ipWhitelist.map((ip, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={ip}
                        onChange={(e) => {
                          const newList = [...settings.security.ipWhitelist];
                          newList[index] = e.target.value;
                          setSettings(prev => ({
                            ...prev,
                            security: { ...prev.security, ipWhitelist: newList }
                          }));
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        placeholder="192.168.1.1"
                      />
                      <button
                        onClick={() => {
                          const newList = settings.security.ipWhitelist.filter((_, i) => i !== index);
                          setSettings(prev => ({
                            ...prev,
                            security: { ...prev.security, ipWhitelist: newList }
                          }));
                        }}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      setSettings(prev => ({
                        ...prev,
                        security: {
                          ...prev.security,
                          ipWhitelist: [...prev.security.ipWhitelist, '']
                        }
                      }));
                    }}
                    className="px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    + Add IP Address
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Settings */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Email Notifications</h3>
                <div className="space-y-3">
                  {Object.entries(settings.notifications).map(([key, value]) => (
                    <label key={key} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          notifications: { ...prev.notifications, [key]: e.target.checked }
                        }))}
                        className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                      />
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* System Preferences */}
          {activeTab === 'system' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                  <select
                    value={settings.system.timezone}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      system: { ...prev.system, timezone: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  >
                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">America/New_York (EST)</option>
                    <option value="Europe/London">Europe/London (GMT)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date Format</label>
                  <select
                    value={settings.system.dateFormat}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      system: { ...prev.system, dateFormat: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                  <select
                    value={settings.system.language}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      system: { ...prev.system, language: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  >
                    <option value="en">English</option>
                    <option value="hi">Hindi</option>
                    <option value="pa">Punjabi</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
                  <select
                    value={settings.system.theme}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      system: { ...prev.system, theme: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="auto">Auto</option>
                  </select>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Backup & Maintenance</h3>
                <div className="space-y-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.system.autoBackup}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        system: { ...prev.system, autoBackup: e.target.checked }
                      }))}
                      className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Enable automatic backups</span>
                  </label>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Backup Frequency</label>
                      <select
                        value={settings.system.backupFrequency}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          system: { ...prev.system, backupFrequency: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Log Retention (days)</label>
                      <input
                        type="number"
                        value={settings.system.logRetention}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          system: { ...prev.system, logRetention: parseInt(e.target.value) }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Integrations Settings */}
          {activeTab === 'integrations' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Cloud Storage</h3>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.integrations.googleDrive}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        integrations: { ...prev.integrations, googleDrive: e.target.checked }
                      }))}
                      className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Google Drive Integration</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.integrations.dropbox}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        integrations: { ...prev.integrations, dropbox: e.target.checked }
                      }))}
                      className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Dropbox Integration</span>
                  </label>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Communication</h3>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.integrations.slack}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      integrations: { ...prev.integrations, slack: e.target.checked }
                    }))}
                    className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Slack Integration</span>
                </label>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">API Configuration</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Webhook URL</label>
                    <input
                      type="url"
                      value={settings.integrations.webhookUrl}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        integrations: { ...prev.integrations, webhookUrl: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="https://api.example.com/webhook"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
                    <div className="relative">
                      <input
                        type={showPasswords.apiKey ? 'text' : 'password'}
                        value={settings.integrations.apiKey}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          integrations: { ...prev.integrations, apiKey: e.target.value }
                        }))}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('apiKey')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showPasswords.apiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
