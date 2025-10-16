import React, { useState, useEffect } from 'react';
import { Search, CheckCircle, XCircle, Eye, Download, Calendar, Building, User, Phone, Mail, MapPin, FileText } from 'lucide-react';
import { apiCall } from '../utils/api';
import { useSocket } from '../contexts/SocketContext';

const RegistrationFormsView = ({ showNotification }) => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const { isConnected } = useSocket();

  useEffect(() => {
    loadRegistrations();
  }, []);

  // Listen for real-time database changes
  useEffect(() => {
    const handleDatabaseChange = (event) => {
      const change = event.detail;
      console.log('🔔 RegistrationFormsView received database change:', change);
      
      if (change.table === 'vendor_registrations') {
        // Update specific registration in state instead of reloading all data
        if (change.action === 'update') {
          console.log('📝 Updating registration:', change.data);
          setRegistrations(prevRegistrations => 
            prevRegistrations.map(reg => 
              reg.id === change.data.id 
                ? { ...reg, status: change.data.status }
                : reg
            )
          );
          
          // Show notification for status changes
          if (change.data.status === 'approved') {
            showNotification(`${change.data.company_name} registration approved`, 'success');
          } else if (change.data.status === 'rejected') {
            showNotification(`${change.data.company_name} registration rejected`, 'warning');
          } else if (change.data.status === 'pending') {
            showNotification(`${change.data.company_name} registration status changed to pending`, 'info');
          }
        } else if (change.action === 'insert') {
          // For new registrations, reload to get the complete data
          loadRegistrations();
          showNotification(`New registration from ${change.data.company_name}`, 'info');
        }
      }
    };

    // Add event listener for database changes
    window.addEventListener('databaseChange', handleDatabaseChange);
    console.log('🎧 RegistrationFormsView: Added database change listener');

    // Cleanup
    return () => {
      window.removeEventListener('databaseChange', handleDatabaseChange);
      console.log('🎧 RegistrationFormsView: Removed database change listener');
    };
  }, [showNotification]);

  const loadRegistrations = async () => {
    try {
      setLoading(true);
      const response = await apiCall('/api/admin/vendor-registrations');
      setRegistrations(response.registrations || []);
    } catch (error) {
      console.error('Error loading registrations:', error);
      showNotification('Failed to load registration forms', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (registrationId) => {
    try {
      const response = await apiCall(`/api/admin/vendor-registrations/${registrationId}/approve`, {
        method: 'POST'
      });
      
      if (response.success) {
        showNotification('Registration approved successfully', 'success');
        loadRegistrations();
      } else {
        showNotification(response.message || 'Failed to approve registration', 'error');
      }
    } catch (error) {
      showNotification('Failed to approve registration', 'error');
    }
  };

  const handleDecline = async (registrationId) => {
    try {
      const response = await apiCall(`/api/admin/vendor-registrations/${registrationId}/decline`, {
        method: 'POST'
      });
      
      if (response.success) {
        showNotification('Registration declined', 'success');
        loadRegistrations();
      } else {
        showNotification(response.message || 'Failed to decline registration', 'error');
      }
    } catch (error) {
      showNotification('Failed to decline registration', 'error');
    }
  };

  const handleViewDetails = (registration) => {
    setSelectedRegistration(registration);
    setShowDetailsModal(true);
  };

  const filteredRegistrations = registrations.filter(registration => {
    const matchesSearch = 
      registration.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      registration.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      registration.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
      registration.status?.toLowerCase() === statusFilter.toLowerCase();
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      approved: { color: 'bg-green-100 text-green-800', label: 'Approved' },
      declined: { color: 'bg-red-100 text-red-800', label: 'Declined' },
      rejected: { color: 'bg-red-100 text-red-800', label: 'Rejected' }
    };
    
    // Normalize status to lowercase for comparison
    const normalizedStatus = status?.toLowerCase() || 'pending';
    const config = statusConfig[normalizedStatus] || statusConfig.pending;
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-900">Registration Forms</h2>
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
              isConnected 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              {isConnected ? 'Live Updates' : 'Offline'}
            </div>
          </div>
          <p className="text-gray-600">Manage vendor registration applications</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={loadRegistrations}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            isConnected 
              ? 'bg-green-100 text-green-700' 
              : 'bg-red-100 text-red-700'
          }`}>
            {isConnected ? '🟢 Live Updates Active' : '🔴 Offline - Click Refresh'}
          </div>
          <button
            onClick={async () => {
              try {
                const response = await fetch('http://localhost:8000/api/admin/broadcast-change', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    table: 'vendor_registrations',
                    action: 'update',
                    data: { id: 5, status: 'pending', company_name: 'Test INC' }
                  })
                });
                const result = await response.json();
                console.log('Manual broadcast result:', result);
                showNotification('Test broadcast sent! Check console for details.', 'info');
              } catch (error) {
                console.error('Manual broadcast error:', error);
                showNotification('Manual broadcast failed!', 'error');
              }
            }}
            className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs"
          >
            Test Broadcast
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by company name, contact person, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="declined">Declined</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Calendar className="text-yellow-600" size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">
                {registrations.filter(r => r.status?.toLowerCase() === 'pending').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="text-green-600" size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-gray-900">
                {registrations.filter(r => r.status?.toLowerCase() === 'approved').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="text-red-600" size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Declined</p>
              <p className="text-2xl font-bold text-gray-900">
                {registrations.filter(r => r.status?.toLowerCase() === 'declined' || r.status?.toLowerCase() === 'rejected').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Registration Forms Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact Person
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Business Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submitted
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRegistrations.map((registration) => (
                <tr key={registration.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Building className="text-gray-400 mr-2" size={16} />
                      <div className="text-sm font-medium text-gray-900">
                        {registration.company_name}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <User className="text-gray-400 mr-2" size={16} />
                      <div className="text-sm text-gray-900">
                        {registration.contact_person}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Mail className="text-gray-400 mr-2" size={16} />
                      <div className="text-sm text-gray-900">
                        {registration.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {registration.business_type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(registration.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(registration.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleViewDetails(registration)}
                        className="text-blue-600 hover:text-blue-900 p-1"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      {/* Show buttons only for pending registrations */}
                      {registration.status?.toLowerCase() === 'pending' && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleApprove(registration.id)}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg border-2 border-green-500 transition-all duration-200 hover:scale-105"
                            title="Approve Registration"
                          >
                            ✓ APPROVE
                          </button>
                          <button
                            onClick={() => handleDecline(registration.id)}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg border-2 border-red-500 transition-all duration-200 hover:scale-105"
                            title="Decline Registration"
                          >
                            ✗ DECLINE
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredRegistrations.length === 0 && (
          <div className="text-center py-12">
            <FileText className="mx-auto text-gray-400" size={48} />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No registration forms</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter !== 'all' 
                ? 'No registrations match your current filters.' 
                : 'No vendor registrations have been submitted yet.'}
            </p>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedRegistration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b flex-shrink-0">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">Registration Details</h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Company Information */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900">Company Information</h4>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <Building className="text-gray-400 mr-3" size={20} />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Company Name</p>
                        <p className="text-gray-900">{selectedRegistration.company_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <User className="text-gray-400 mr-3" size={20} />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Contact Person</p>
                        <p className="text-gray-900">{selectedRegistration.contact_person}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Mail className="text-gray-400 mr-3" size={20} />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Email</p>
                        <p className="text-gray-900">{selectedRegistration.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Phone className="text-gray-400 mr-3" size={20} />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Phone</p>
                        <p className="text-gray-900">{selectedRegistration.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <MapPin className="text-gray-400 mr-3 mt-1" size={20} />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Address</p>
                        <p className="text-gray-900">{selectedRegistration.address}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Business Information */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900">Business Information</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Business Type</p>
                      <p className="text-gray-900">{selectedRegistration.business_type}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Services</p>
                      <p className="text-gray-900">{selectedRegistration.services}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Experience</p>
                      <p className="text-gray-900">{selectedRegistration.experience}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Certifications</p>
                      <p className="text-gray-900">{selectedRegistration.certifications || 'None provided'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">References</p>
                      <p className="text-gray-900">{selectedRegistration.vendor_references || 'None provided'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status and Actions */}
              <div className="mt-8 pt-6 border-t">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Status</p>
                    {getStatusBadge(selectedRegistration.status)}
                  </div>
                  {selectedRegistration.status?.toLowerCase() === 'pending' && (
                    <div className="flex space-x-3">
                      <button
                        onClick={() => {
                          handleApprove(selectedRegistration.id);
                          setShowDetailsModal(false);
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          handleDecline(selectedRegistration.id);
                          setShowDetailsModal(false);
                        }}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Decline
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistrationFormsView;
