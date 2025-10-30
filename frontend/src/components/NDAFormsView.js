import React, { useState, useEffect } from 'react';
import { 
  Search, Download, Mail, Calendar, Building, User, Phone, MapPin, FileText, 
  CheckCircle, Clock, ArrowUpDown, Filter, Plus, Send, AlertCircle, 
  TrendingUp, Users, FileCheck, BarChart3, RefreshCw, Eye, Trash2
} from 'lucide-react';
import { apiCall } from '../utils/api';

const NDAFormsView = ({ showNotification }) => {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState('signed_date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [selectedForms, setSelectedForms] = useState([]);
  const [selectedForm, setSelectedForm] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);

  useEffect(() => {
    loadForms();
  }, []);

  // Listen for real-time submissions
  useEffect(() => {
    const handleDatabaseChange = (event) => {
      const change = event.detail;
      if (change && change.table === 'nda_forms') {
        loadForms();
      }
    };
    window.addEventListener('databaseChange', handleDatabaseChange);
    return () => window.removeEventListener('databaseChange', handleDatabaseChange);
  }, []);

  const loadForms = async () => {
    try {
      setLoading(true);
      const data = await apiCall('/api/admin/nda-forms');
      setForms(data);
    } catch (error) {
      console.error('Error loading forms:', error);
      showNotification('Failed to load NDA forms', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Calculate summary statistics
  const getSummaryStats = () => {
    const total = forms.length;
    const pending = forms.filter(f => f.nda_status === 'pending').length;
    const approved = forms.filter(f => f.nda_status === 'approved').length;
    const completed = forms.filter(f => f.nda_status === 'completed').length;
    
    // This month's submissions
    const thisMonth = new Date();
    thisMonth.setDate(1);
    const thisMonthCount = forms.filter(f => 
      f.signed_date && new Date(f.signed_date) >= thisMonth
    ).length;

    return { total, pending, approved, completed, thisMonthCount };
  };

  const stats = getSummaryStats();

  // Enhanced filtering and sorting
  const filteredAndSortedForms = forms
    .filter(form => {
      const matchesSearch = 
        form.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        form.reference_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        form.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        form.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || form.nda_status === statusFilter;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      // Handle date sorting
      if (sortField === 'signed_date') {
        aValue = aValue ? new Date(aValue) : new Date(0);
        bValue = bValue ? new Date(bValue) : new Date(0);
      }
      
      // Handle string sorting
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleSelectForm = (formId) => {
    setSelectedForms(prev => 
      prev.includes(formId) 
        ? prev.filter(id => id !== formId)
        : [...prev, formId]
    );
  };

  const handleSelectAll = () => {
    if (selectedForms.length === filteredAndSortedForms.length) {
      setSelectedForms([]);
    } else {
      setSelectedForms(filteredAndSortedForms.map(f => f.id));
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedForms.length === 0) {
      showNotification('Please select forms first', 'warning');
      return;
    }

    try {
      switch (action) {
        case 'download':
          // Download each selected form
          for (const formId of selectedForms) {
            const form = forms.find(f => f.id === formId);
            if (form && form.reference_number) {
              await handleDownloadNDA(form.reference_number);
              // Small delay to prevent overwhelming the server
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          }
          showNotification(`Downloaded ${selectedForms.length} NDA form(s)`, 'success');
          setSelectedForms([]);
          break;
        case 'send':
          // Send reminders for selected forms
          showNotification(`Sending reminders to ${selectedForms.length} vendor(s)...`, 'info');
          let successCount = 0;
          for (const formId of selectedForms) {
            const form = forms.find(f => f.id === formId);
            if (form && form.reference_number && form.email) {
              try {
                await handleSendCompletedNDA(form.reference_number);
                successCount++;
                await new Promise(resolve => setTimeout(resolve, 1000));
              } catch (error) {
                console.error('Error sending reminder:', error);
              }
            }
          }
          showNotification(`Reminders sent to ${successCount} vendor(s)`, 'success');
          setSelectedForms([]);
          break;
        case 'export':
          // Export selected forms to CSV
          const csvData = selectedForms.map(formId => {
            const form = forms.find(f => f.id === formId);
            return form ? {
              reference: form.reference_number,
              company: form.company_name,
              contact: form.contact_person,
              email: form.email,
              status: form.nda_status,
              submitted: form.signed_date
            } : null;
          }).filter(Boolean);
          
          const csvContent = [
            ['Reference', 'Company', 'Contact', 'Email', 'Status', 'Submitted Date'],
            ...csvData.map(row => [
              row.reference,
              row.company,
              row.contact,
              row.email,
              row.status,
              row.submitted
            ])
          ].map(row => row.join(',')).join('\n');
          
          const blob = new Blob([csvContent], { type: 'text/csv' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `nda_export_${new Date().toISOString().split('T')[0]}.csv`;
          a.style.display = 'none';
          document.body.appendChild(a);
          a.click();
          setTimeout(() => {
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
          }, 100);
          
          showNotification(`Exported ${selectedForms.length} NDA form(s)`, 'success');
          setSelectedForms([]);
          break;
        case 'delete':
          // Delete selected forms (with confirmation)
          if (window.confirm(`Are you sure you want to delete ${selectedForms.length} NDA form(s)? This action cannot be undone.`)) {
            let deletedCount = 0;
            for (const formId of selectedForms) {
              const form = forms.find(f => f.id === formId);
              if (form) {
                try {
                  const response = await apiCall(`/api/admin/nda-forms/${formId}`, {
                    method: 'DELETE'
                  });
                  if (response.success) {
                    deletedCount++;
                  }
                } catch (error) {
                  console.error('Error deleting form:', error);
                }
              }
            }
            showNotification(`Deleted ${deletedCount} NDA form(s)`, 'success');
            setSelectedForms([]);
            loadForms(); // Reload the list
          }
          break;
      }
    } catch (error) {
      console.error('Bulk action error:', error);
      showNotification('Bulk action failed', 'error');
    }
  };

  const handleDownloadNDA = async (referenceNumber) => {
    try {
      showNotification('Preparing PDF download...', 'info');
      
      // Use direct fetch for binary data (PDF)
      const response = await fetch(`http://localhost:8000/api/admin/download-nda/${referenceNumber}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/pdf',
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/pdf')) {
        throw new Error('Invalid PDF content type received');
      }
      
      const blob = await response.blob();
      
      if (blob.size === 0) {
        throw new Error('Empty PDF file received');
      }
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `NDA_${referenceNumber}.pdf`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);
      
      showNotification('NDA PDF downloaded successfully', 'success');
    } catch (error) {
      console.error('Download error:', error);
      showNotification(`Failed to download PDF: ${error.message}`, 'error');
    }
  };

  const handleSendCompletedNDA = async (referenceNumber) => {
    try {
      const response = await apiCall('/api/admin/send-completed-nda-email', {
        method: 'POST',
        body: JSON.stringify({ reference_number: referenceNumber })
      });
      
      if (response.success) {
        showNotification('Completed NDA sent to vendor email', 'success');
      } else {
        showNotification('Failed to send completed NDA', 'error');
      }
    } catch (error) {
      console.error('Send email error:', error);
      showNotification('Failed to send completed NDA', 'error');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'approved': return 'bg-green-100 text-green-700 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'rejected': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle size={16} />;
      case 'approved': return <CheckCircle size={16} />;
      case 'pending': return <Clock size={16} />;
      case 'rejected': return <AlertCircle size={16} />;
      default: return <Clock size={16} />;
    }
  };

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
          <h2 className="text-2xl font-bold text-gray-900">Submitted NDA Forms</h2>
          <p className="text-gray-600 mt-1">{stats.total} forms</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={loadForms}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          <button
            onClick={() => setShowBulkActions(!showBulkActions)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Plus size={16} />
            Bulk Actions
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Forms</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Review</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="text-yellow-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-blue-600">{stats.completed}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileCheck className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-purple-600">{stats.thisMonthCount}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="text-purple-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {showBulkActions && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Bulk Actions</h3>
            <span className="text-sm text-gray-600">{selectedForms.length} forms selected</span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => handleBulkAction('download')}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              <Download size={16} />
              Download Selected
            </button>
            <button
              onClick={() => handleBulkAction('send')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Send size={16} />
              Send Reminders
            </button>
            <button
              onClick={() => handleBulkAction('export')}
              className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
            >
              <BarChart3 size={16} />
              Export Data
            </button>
            <button
              onClick={() => handleBulkAction('delete')}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              <Trash2 size={16} />
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-6 border-b">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by company, reference number, contact person, or email..."
                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div className="flex gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
              </select>
              <button className="flex items-center gap-2 px-4 py-3 border rounded-lg hover:bg-gray-50 transition-colors">
                <Filter size={16} />
                More Filters
              </button>
            </div>
          </div>
        </div>

        {/* Forms Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedForms.length === filteredAndSortedForms.length && filteredAndSortedForms.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('reference_number')}
                >
                  <div className="flex items-center gap-2">
                    Reference
                    <ArrowUpDown size={14} />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('company_name')}
                >
                  <div className="flex items-center gap-2">
                    Company
                    <ArrowUpDown size={14} />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Contact</th>
                <th 
                  className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('nda_status')}
                >
                  <div className="flex items-center gap-2">
                    Status
                    <ArrowUpDown size={14} />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('signed_date')}
                >
                  <div className="flex items-center gap-2">
                    Submitted
                    <ArrowUpDown size={14} />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredAndSortedForms.map(form => (
                <tr key={form.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedForms.includes(form.id)}
                      onChange={() => handleSelectForm(form.id)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <FileText className="text-blue-500" size={16} />
                      <span className="font-mono text-sm font-medium">{form.reference_number}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-semibold">{form.company_name?.[0] || '?'}</span>
                      </div>
                      <div>
                        <div className="font-medium">{form.company_name}</div>
                        <div className="text-sm text-gray-500">{form.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium">{form.contact_person}</div>
                      <div className="text-sm text-gray-500 flex items-center gap-1">
                        <Phone size={12} />
                        {form.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(form.nda_status)}`}>
                      {getStatusIcon(form.nda_status)}
                      {form.nda_status?.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Calendar size={14} />
                      {formatDate(form.signed_date)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedForm(form);
                          setShowDetails(true);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handleDownloadNDA(form.reference_number)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Download NDA"
                      >
                        <Download size={16} />
                      </button>
                      <button
                        onClick={() => handleSendCompletedNDA(form.reference_number)}
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="Send to Vendor"
                      >
                        <Mail size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredAndSortedForms.length === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText className="text-gray-400" size={48} />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchTerm || statusFilter !== 'all' ? 'No forms match your criteria' : 'No NDA forms submitted yet'}
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria to find what you\'re looking for.'
                : 'NDA forms will appear here once vendors complete the submission process. You can send NDAs to vendors to get started.'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <div className="flex gap-3 justify-center">
                <button className="flex items-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors">
                  <Send size={16} />
                  Send First NDA
                </button>
                <button className="flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  <Users size={16} />
                  Import Vendors
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Form Details Modal */}
      {showDetails && selectedForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b flex-shrink-0">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">NDA Form Details</h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 modal-scrollbar">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Building size={20} />
                    Company Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Company Name:</span> {selectedForm.company_name}</div>
                    <div><span className="font-medium">Registration Number:</span> {selectedForm.company_registration_number}</div>
                    <div><span className="font-medium">Country:</span> {selectedForm.company_incorporation_country}</div>
                    <div><span className="font-medium">State:</span> {selectedForm.company_incorporation_state}</div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <User size={20} />
                    Contact Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Contact Person:</span> {selectedForm.contact_person}</div>
                    <div><span className="font-medium">Email:</span> {selectedForm.email}</div>
                    <div><span className="font-medium">Phone:</span> {selectedForm.phone}</div>
                    <div className="flex items-start gap-2">
                      <MapPin size={16} className="mt-0.5 text-gray-400" />
                      <span><span className="font-medium">Address:</span> {selectedForm.address}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Status */}
              <div className="space-y-4 mb-6">
                <h4 className="font-semibold text-gray-900">Form Status & Details</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm font-medium text-gray-600">Reference Number</div>
                    <div className="font-mono text-lg font-bold">{selectedForm.reference_number}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm font-medium text-gray-600">Status</div>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(selectedForm.nda_status)}`}>
                      {getStatusIcon(selectedForm.nda_status)}
                      {selectedForm.nda_status?.toUpperCase()}
                    </span>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm font-medium text-gray-600">Signed Date</div>
                    <div className="font-medium">{formatDate(selectedForm.signed_date)}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm font-medium text-gray-600">Portal Access</div>
                    <div className="font-medium">{selectedForm.portal_access ? 'Granted' : 'Pending'}</div>
                  </div>
                </div>
              </div>

              {/* Signature Information */}
              <div className="space-y-4 mb-6">
                <h4 className="font-semibold text-gray-900">Signature & Documentation</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm font-medium text-gray-600">Signature Type</div>
                    <div className="font-medium capitalize">{selectedForm.signature_type || 'N/A'}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm font-medium text-gray-600">Signature Provided</div>
                    <div className="font-medium">{selectedForm.has_signature ? 'Yes' : 'No'}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm font-medium text-gray-600">Company Stamp</div>
                    <div className="font-medium">{selectedForm.has_company_stamp ? 'Yes' : 'No'}</div>
                  </div>
                </div>
                
                {/* Signature Display */}
                {selectedForm.has_signature && (
                  <div className="mt-6">
                    <h5 className="font-semibold text-gray-900 mb-3">Digital Signature</h5>
                    <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
                      <img 
                        src={selectedForm.signature_data} 
                        alt="Digital Signature" 
                        className="max-w-full h-auto border border-gray-300 rounded"
                        style={{ maxHeight: '200px' }}
                      />
                      <p className="text-sm text-gray-600 mt-2">
                        Signature Type: <span className="font-medium capitalize">{selectedForm.signature_type}</span>
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Company Stamp Display */}
                {selectedForm.has_company_stamp && (
                  <div className="mt-6">
                    <h5 className="font-semibold text-gray-900 mb-3">Company Stamp</h5>
                    <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
                      <img 
                        src={selectedForm.company_stamp_data} 
                        alt="Company Stamp" 
                        className="max-w-full h-auto border border-gray-300 rounded"
                        style={{ maxHeight: '200px' }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 border-t flex-shrink-0">
              <div className="flex gap-3">
                <button
                  onClick={() => handleDownloadNDA(selectedForm.reference_number)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  <Download size={16} />
                  Download NDA PDF
                </button>
                <button
                  onClick={() => handleSendCompletedNDA(selectedForm.reference_number)}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                >
                  <Mail size={16} />
                  Send to Vendor
                </button>
                <button
                  onClick={() => setShowDetails(false)}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NDAFormsView;
