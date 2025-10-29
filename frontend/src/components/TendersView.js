import React, { useState, useEffect } from 'react';
import { 
  Plus, Building, Search, Filter, X, Edit, Trash2, Eye,
  Calendar, DollarSign, FileText, MapPin, Mail, Phone, 
  AlertCircle, CheckCircle, Clock, Award, Ban, FileIcon, Download
} from 'lucide-react';
import { apiCall, API_BASE } from '../utils/api';

const TendersView = ({ showNotification }) => {
  const [tenders, setTenders] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTender, setSelectedTender] = useState(null);
  const [tenderForm, setTenderForm] = useState({
    tender_number: '',
    tender_name: '',
    short_name: '',
    title: '',
    description: '',
    tender_type: 'government',
    category: '',
    organization_name: '',
    budget_amount: '',
    currency: 'INR',
    published_date: '',
    rfp_date: '',
    submission_deadline: '',
    rfq_date: '',
    opening_date: '',
    status: 'new',
    query: '',
    contact_person: '',
    contact_email: '',
    contact_phone: '',
    location: '',
    eligibility_criteria: '',
    documents_required: '',
    important_documents: [],
    project_coordinator_id: '',
    project_team_ids: []
  });

  useEffect(() => {
    loadTenders();
  }, [typeFilter]);

  const loadTenders = async () => {
    try {
      setLoading(true);
      const url = typeFilter === 'all' 
        ? '/api/admin/tenders' 
        : `/api/admin/tenders?type=${typeFilter}`;
      const [data, employeesData] = await Promise.all([
        apiCall(url),
        apiCall('/api/admin/employees')
      ]);
      setTenders(data || []);
      setEmployees(employeesData || []);
    } catch (error) {
      console.error('Error loading tenders:', error);
      showNotification('Failed to load tenders', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getCodeFromEmployee = (emp) => {
    return (
      (emp && (emp.salary_code || emp.salaryCode || emp.employeeId || emp.employee_id)) || ''
    ).toString().trim();
  };

  const resolveEmployeeByCode = (code) => {
    const normalized = (code || '').toString().trim();
    if (!normalized) return null;
    return employees.find(emp => getCodeFromEmployee(emp) === normalized) || null;
  };

  const handleCreateTender = async () => {
    try {
      if (!tenderForm.tender_number || !tenderForm.title) {
        showNotification('Tender number and title are required', 'error');
        return;
      }

      await apiCall('/api/admin/tenders', {
        method: 'POST',
        body: JSON.stringify(tenderForm)
      });

      showNotification('Tender created successfully', 'success');
      setShowCreateModal(false);
      resetForm();
      loadTenders();
    } catch (error) {
      console.error('Error creating tender:', error);
      showNotification('Failed to create tender', 'error');
    }
  };

  const handleEditTender = async () => {
    try {
      await apiCall(`/api/admin/tenders/${selectedTender.id}`, {
        method: 'PUT',
        body: JSON.stringify(tenderForm)
      });

      showNotification('Tender updated successfully', 'success');
      setShowEditModal(false);
      setSelectedTender(null);
      resetForm();
      loadTenders();
    } catch (error) {
      console.error('Error updating tender:', error);
      showNotification('Failed to update tender', 'error');
    }
  };

  const handleExport = () => {
    // Navigate browser to API endpoint to allow proper file headers/cookies
    const url = `${API_BASE}/api/admin/tenders/export`;
    window.location.href = url;
  };

  const handleDeleteTender = async (tenderId) => {
    if (!window.confirm('Are you sure you want to delete this tender?')) {
      return;
    }

    try {
      await apiCall(`/api/admin/tenders/${tenderId}`, {
        method: 'DELETE'
      });

      showNotification('Tender deleted successfully', 'success');
      loadTenders();
    } catch (error) {
      console.error('Error deleting tender:', error);
      showNotification('Failed to delete tender', 'error');
    }
  };

  const resetForm = () => {
    setTenderForm({
      tender_number: '',
      tender_name: '',
      short_name: '',
      title: '',
      description: '',
      tender_type: 'government',
      category: '',
      organization_name: '',
      budget_amount: '',
      currency: 'INR',
      published_date: '',
      rfp_date: '',
      submission_deadline: '',
      rfq_date: '',
      opening_date: '',
      status: 'new',
      query: '',
      contact_person: '',
      contact_email: '',
      contact_phone: '',
      location: '',
      eligibility_criteria: '',
      documents_required: '',
      important_documents: [],
      project_coordinator_id: '',
      project_team_ids: [],
      coordinator_salary_code: '',
      team_salary_codes: ''
    });
  };

  const openEditModal = (tender) => {
    setSelectedTender(tender);
    setTenderForm({ ...tender });
    setShowEditModal(true);
  };

  const openDetailModal = (tender) => {
    setSelectedTender(tender);
    setShowDetailModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'tender_submitted':
        return 'bg-blue-100 text-blue-800';
      case 'working_on_it':
        return 'bg-yellow-100 text-yellow-800';
      case 'awarded':
        return 'bg-green-100 text-green-800';
      case 'queries_submitted':
      case 'appendix_ab_submitted':
        return 'bg-cyan-100 text-cyan-800';
      case 'need_extension_on_tender':
        return 'bg-orange-100 text-orange-800';
      case 'skipped':
        return 'bg-gray-100 text-gray-800';
      case 'lost':
      case 'rejected_awarded_to_other_company':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'tender_submitted':
        return <CheckCircle size={16} />;
      case 'working_on_it':
        return <Clock size={16} />;
      case 'awarded':
        return <Award size={16} />;
      case 'queries_submitted':
      case 'appendix_ab_submitted':
        return <FileText size={16} />;
      case 'need_extension_on_tender':
        return <Clock size={16} />;
      case 'skipped':
        return <FileIcon size={16} />;
      case 'lost':
      case 'rejected_awarded_to_other_company':
        return <Ban size={16} />;
      default:
        return <FileIcon size={16} />;
    }
  };

  const formatStatus = (status) => {
    if (!status) return '-';
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
      .replace(/Ab/gi, 'A/B');
  };

  const getTypeColor = (type) => {
    return type === 'government' 
      ? 'bg-blue-50 text-blue-700 border border-blue-200' 
      : 'bg-amber-50 text-amber-700 border border-amber-200';
  };

  const formatCurrency = (amount, currency = 'INR') => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const filteredTenders = tenders.filter(tender => {
    const matchesSearch = tender.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tender.tender_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tender.organization_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || tender.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tenders</h1>
          <p className="text-gray-600">Manage government and private tenders</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Download size={20} />
            Export Report
          </button>
          <button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          >
            <Plus size={20} />
            Create New Tender
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Tenders</p>
              <p className="text-2xl font-bold text-gray-900">{tenders.length}</p>
            </div>
            <FileText className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Government</p>
              <p className="text-2xl font-bold text-gray-900">
                {tenders.filter(t => t.tender_type === 'government').length}
              </p>
            </div>
            <Building className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Private</p>
              <p className="text-2xl font-bold text-gray-900">
                {tenders.filter(t => t.tender_type === 'private').length}
              </p>
            </div>
            <Building className="h-8 w-8 text-amber-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Open</p>
              <p className="text-2xl font-bold text-gray-900">
                {tenders.filter(t => t.status === 'open' || t.status === 'published').length}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search tenders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="government">Government</option>
            <option value="private">Private</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="tender_submitted">Tender Submitted</option>
            <option value="skipped">Skipped</option>
            <option value="lost">Lost</option>
            <option value="awarded">Awarded</option>
            <option value="working_on_it">Working on it</option>
            <option value="rejected_awarded_to_other_company">Rejected / Awarded to other company</option>
            <option value="need_extension_on_tender">Need Extension on Tender</option>
            <option value="queries_submitted">Queries Submitted</option>
            <option value="appendix_ab_submitted">Appendix A/B Submitted</option>
          </select>
        </div>
      </div>

      {/* Tenders Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">No.</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tender Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tender Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Today Update (Log)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Updated By</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTenders.map((tender, idx) => (
                <tr key={tender.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{idx + 1}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{tender.category || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{tender.tender_name || tender.title}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{tender.tender_number}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(tender.status)}`}>
                      {getStatusIcon(tender.status)}
                      {formatStatus(tender.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {tender.submission_deadline ? new Date(tender.submission_deadline).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 whitespace-pre-wrap">
                    {tender.today_update_message || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {tender.today_update_by || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredTenders.length === 0 && (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No tenders found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || typeFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by creating a new tender.'}
            </p>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                {showCreateModal ? 'Create New Tender' : 'Edit Tender'}
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                  setSelectedTender(null);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Column 1 */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tender Number *
                    </label>
                    <input
                      type="text"
                      value={tenderForm.tender_number}
                      onChange={(e) => setTenderForm({...tenderForm, tender_number: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="TND-2025-001"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tender Name *</label>
                    <input
                      type="text"
                      value={tenderForm.tender_name}
                      onChange={(e) => setTenderForm({...tenderForm, tender_name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Short Name</label>
                    <input
                      type="text"
                      value={tenderForm.short_name}
                      onChange={(e) => setTenderForm({...tenderForm, short_name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={tenderForm.title}
                      onChange={(e) => setTenderForm({...tenderForm, title: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tender Type *
                    </label>
                    <select
                      value={tenderForm.tender_type}
                      onChange={(e) => setTenderForm({...tenderForm, tender_type: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    >
                      <option value="government">Government</option>
                      <option value="private">Private</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <input
                      type="text"
                      value={tenderForm.category}
                      onChange={(e) => setTenderForm({...tenderForm, category: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="e.g., IT Services, Construction, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Organization Name
                    </label>
                    <input
                      type="text"
                      value={tenderForm.organization_name}
                      onChange={(e) => setTenderForm({...tenderForm, organization_name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Budget Amount
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={tenderForm.currency}
                        onChange={(e) => setTenderForm({...tenderForm, currency: e.target.value})}
                        className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="INR">INR</option>
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                      </select>
                      <input
                        type="number"
                        value={tenderForm.budget_amount}
                        onChange={(e) => setTenderForm({...tenderForm, budget_amount: e.target.value})}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status *
                    </label>
                    <select
                      value={tenderForm.status}
                      onChange={(e) => setTenderForm({...tenderForm, status: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    >
                      <option value="tender_submitted">Tender Submitted</option>
                      <option value="skipped">Skipped</option>
                      <option value="lost">Lost</option>
                      <option value="awarded">Awarded</option>
                      <option value="working_on_it">Working on it</option>
                      <option value="rejected_awarded_to_other_company">Rejected / Awarded to other company</option>
                      <option value="need_extension_on_tender">Need Extension on Tender</option>
                      <option value="queries_submitted">Queries Submitted</option>
                      <option value="appendix_ab_submitted">Appendix A/B Submitted</option>
                    </select>
                  </div>
                </div>

                {/* Column 2 */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Published Date
                    </label>
                    <input
                      type="date"
                      value={tenderForm.published_date}
                      onChange={(e) => setTenderForm({...tenderForm, published_date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">RFP Date</label>
                    <input
                      type="date"
                      value={tenderForm.rfp_date}
                      onChange={(e) => setTenderForm({...tenderForm, rfp_date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Submission Deadline *
                    </label>
                    <input
                      type="date"
                      value={tenderForm.submission_deadline}
                      onChange={(e) => setTenderForm({...tenderForm, submission_deadline: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">RFQ Date</label>
                    <input
                      type="date"
                      value={tenderForm.rfq_date}
                      onChange={(e) => setTenderForm({...tenderForm, rfq_date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Opening Date
                    </label>
                    <input
                      type="date"
                      value={tenderForm.opening_date}
                      onChange={(e) => setTenderForm({...tenderForm, opening_date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      value={tenderForm.location}
                      onChange={(e) => setTenderForm({...tenderForm, location: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="City, State"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Person
                    </label>
                    <input
                      type="text"
                      value={tenderForm.contact_person}
                      onChange={(e) => setTenderForm({...tenderForm, contact_person: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Email
                    </label>
                    <input
                      type="email"
                      value={tenderForm.contact_email}
                      onChange={(e) => setTenderForm({...tenderForm, contact_email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Phone
                    </label>
                    <input
                      type="text"
                      value={tenderForm.contact_phone}
                      onChange={(e) => setTenderForm({...tenderForm, contact_phone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Query</label>
                    <input
                      type="text"
                      value={tenderForm.query}
                      onChange={(e) => setTenderForm({...tenderForm, query: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Full Width Fields */}
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Project Coordinator *</label>
                    <input
                      type="text"
                      value={tenderForm.coordinator_salary_code}
                      onChange={(e) => {
                        const code = String(e.target.value || '').trim();
                        const emp = resolveEmployeeByCode(code);
                        setTenderForm({
                          ...tenderForm,
                          coordinator_salary_code: code,
                          project_coordinator_id: emp ? emp.id : ''
                        });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="Salary Code"
                    />
                    {tenderForm.project_coordinator_id && (
                      <p className="mt-1 text-xs text-green-700">Coordinator: {employees.find(emp => emp.id === tenderForm.project_coordinator_id)?.name}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Project Team (Salary Codes, comma separated)</label>
                    <input
                      type="text"
                      value={tenderForm.team_salary_codes}
                      onChange={(e) => {
                        const raw = e.target.value || '';
                        const codes = raw.split(',').map(v => String(v).trim()).filter(Boolean);
                        const ids = codes
                          .map(code => {
                            const emp = resolveEmployeeByCode(code);
                            return emp ? emp.id : null;
                          })
                          .filter(id => id !== null);
                        setTenderForm({
                          ...tenderForm,
                          team_salary_codes: raw,
                          project_team_ids: ids
                        });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="e.g., SC001, SC002"
                    />
                    {Array.isArray(tenderForm.project_team_ids) && tenderForm.project_team_ids.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {tenderForm.project_team_ids.map(id => (
                          <span key={id} className="px-2 py-1 text-xs bg-green-50 text-green-700 border border-green-200 rounded">
                            {employees.find(emp => emp.id === id)?.name || id}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={tenderForm.description}
                    onChange={(e) => setTenderForm({...tenderForm, description: e.target.value})}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="Detailed description of the tender..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Eligibility Criteria
                  </label>
                  <textarea
                    value={tenderForm.eligibility_criteria}
                    onChange={(e) => setTenderForm({...tenderForm, eligibility_criteria: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="Requirements and eligibility criteria..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Documents Required
                  </label>
                  <textarea
                    value={tenderForm.documents_required}
                    onChange={(e) => setTenderForm({...tenderForm, documents_required: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="List of required documents..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                    setSelectedTender(null);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={showCreateModal ? handleCreateTender : handleEditTender}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                >
                  {showCreateModal ? 'Create Tender' : 'Update Tender'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedTender && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Tender Details</h3>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedTender(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Tender Number</label>
                  <p className="text-gray-900 font-semibold">{selectedTender.tender_number}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Type</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(selectedTender.tender_type)}`}>
                    {selectedTender.tender_type === 'government' ? 'Government' : 'Private'}
                  </span>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedTender.status)}`}>
                    {getStatusIcon(selectedTender.status)}
                    {formatStatus(selectedTender.status)}
                  </span>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Budget</label>
                  <p className="text-gray-900 font-semibold">
                    {formatCurrency(selectedTender.budget_amount, selectedTender.currency)}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Title</label>
                <p className="text-gray-900 font-semibold">{selectedTender.title}</p>
              </div>

              {selectedTender.description && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Description</label>
                  <p className="text-gray-900">{selectedTender.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {selectedTender.published_date && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Published Date</label>
                    <p className="text-gray-900">
                      {new Date(selectedTender.published_date).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {selectedTender.submission_deadline && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Submission Deadline</label>
                    <p className="text-gray-900">
                      {new Date(selectedTender.submission_deadline).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {selectedTender.opening_date && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Opening Date</label>
                    <p className="text-gray-900">
                      {new Date(selectedTender.opening_date).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {selectedTender.location && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Location</label>
                    <p className="text-gray-900">{selectedTender.location}</p>
                  </div>
                )}
              </div>

              {selectedTender.eligibility_criteria && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Eligibility Criteria</label>
                  <p className="text-gray-900 whitespace-pre-wrap">{selectedTender.eligibility_criteria}</p>
                </div>
              )}

              {selectedTender.documents_required && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Documents Required</label>
                  <p className="text-gray-900 whitespace-pre-wrap">{selectedTender.documents_required}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TendersView;

