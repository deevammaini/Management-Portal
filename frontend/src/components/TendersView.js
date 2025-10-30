import React, { useState, useEffect } from 'react';
import { 
  Plus, Building, Search, Filter, X, Edit, Trash2, Eye,
  Calendar, DollarSign, FileText, MapPin, Mail, Phone, 
  AlertCircle, CheckCircle, Clock, Award, Ban, FileIcon, Download,
  UserCheck
} from 'lucide-react';
import { apiCall, API_BASE } from '../utils/api';

const TendersView = ({ showNotification }) => {
  const [tenders, setTenders] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignTenderId, setAssignTenderId] = useState('');
  const [assignVendorId, setAssignVendorId] = useState('');
  const [assignmentType, setAssignmentType] = useState('inhouse'); // inhouse | outsourced
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [progressTender, setProgressTender] = useState(null);
  const [selectedTender, setSelectedTender] = useState(null);
  const [showExtensionModal, setShowExtensionModal] = useState(false);
  const [extensionLogs, setExtensionLogs] = useState([]);
  const [extensionForm, setExtensionForm] = useState({ date_field: 'submission_deadline', new_date: '', reason: '' });
  const [coordinatorSearch, setCoordinatorSearch] = useState('');
  const [teamSearch, setTeamSearch] = useState('');
  const [coordinatorResults, setCoordinatorResults] = useState([]);
  const [teamResults, setTeamResults] = useState([]);
  const [tenderForm, setTenderForm] = useState({
    tender_number: '',
    tender_name: '',
    short_name: '',
    description: '',
    tender_type: 'government',
    category: '',
    organization_name: '',
    budget_amount: '',
    currency: 'INR',
    published_date: '',
    query_submission_date: '',
    appendix_ab_submission_date: '',
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
      const [data, employeesData, vendorsData] = await Promise.all([
        apiCall(url),
        apiCall('/api/admin/employees'),
        apiCall('/api/admin/vendors')
      ]);
      setTenders(data || []);
      setEmployees(employeesData || []);
      setVendors((vendorsData || []).filter(v => v && v.id !== 'metadata'));
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
      if (!tenderForm.tender_number || !tenderForm.tender_name) {
        showNotification('Tender number and tender name are required', 'error');
        return;
      }

      const payload = { ...tenderForm, title: tenderForm.tender_name, status: 'new' };

      await apiCall('/api/admin/tenders', {
        method: 'POST',
        body: JSON.stringify(payload)
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

  const handleAssignVendor = async () => {
    if (!assignTenderId) {
      showNotification('Please select a tender', 'error');
      return;
    }
    if (assignmentType === 'inhouse') {
      // No vendor assignment needed
      showNotification('Marked as In-house; no vendor assignment applied', 'success');
      setShowAssignModal(false);
      setAssignTenderId('');
      setAssignVendorId('');
      setAssignmentType('inhouse');
      return;
    }
    if (!assignVendorId) {
      showNotification('Please select a vendor for Outsourced assignment', 'error');
      return;
    }
    try {
      await apiCall(`/api/admin/tenders/${assignTenderId}/assign-vendor`, {
        method: 'POST',
        body: JSON.stringify({ vendor_id: assignVendorId })
      });
      showNotification('Assigned vendor to tender', 'success');
      setShowAssignModal(false);
      setAssignTenderId('');
      setAssignVendorId('');
      setAssignmentType('inhouse');
      loadTenders();
    } catch (e) {
      showNotification('Failed to assign vendor', 'error');
    }
  };

  const resetForm = () => {
    setTenderForm({
      tender_number: '',
      tender_name: '',
      short_name: '',
      description: '',
      tender_type: 'government',
      category: '',
      organization_name: '',
      budget_amount: '',
      currency: 'INR',
      published_date: '',
      query_submission_date: '',
      appendix_ab_submission_date: '',
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

  const openExtensionModal = async (tender) => {
    setSelectedTender(tender);
    setExtensionForm({ date_field: 'submission_deadline', new_date: '', reason: '' });
    try {
      const logs = await apiCall(`/api/admin/tenders/${tender.id}/extensions`);
      setExtensionLogs(Array.isArray(logs) ? logs : []);
    } catch {
      setExtensionLogs([]);
    }
    setShowExtensionModal(true);
  };

  const submitExtension = async () => {
    if (!selectedTender) return;
    if (!extensionForm.new_date) { showNotification('Select new date', 'error'); return; }
    try {
      await apiCall(`/api/admin/tenders/${selectedTender.id}/extensions`, { method: 'POST', body: JSON.stringify(extensionForm) });
      showNotification('Extension saved', 'success');
      setShowExtensionModal(false);
      await loadTenders();
    } catch (e) {
      showNotification('Failed to save extension', 'error');
    }
  }

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

  const steps = [
    'New Tender',
    'Assigned to Vendor',
    'Under Discussion',
    'Documents received from Vendor',
    'Tender Submitted',
    'Awarded or Lost'
  ];

  const computeStageIndex = (tender) => {
    // 1-based index
    if (!tender) return 1;
    if (tender.status === 'awarded' || tender.status === 'lost' || tender.status === 'rejected_awarded_to_other_company') return 6;
    if (tender.status === 'tender_submitted') return 5;
    // Heuristics for stages 3-4 based on update logs
    if (tender.status === 'queries_submitted' || tender.status === 'need_extension_on_tender') return 3;
    if (tender.status === 'appendix_ab_submitted') return 4;
    if (tender.assigned_vendor_id) return 2;
    return 1;
  };

  const computeProgressPercent = (idx) => {
    const total = steps.length;
    const clamped = Math.max(1, Math.min(idx, total));
    return Math.round(((clamped - 1) / (total - 1)) * 100);
  };

  const getStepClass = (i, currentIdx) => {
    if (i < currentIdx) return 'bg-green-500 border-green-500 text-white';
    if (i === currentIdx) return 'bg-blue-600 border-blue-600 text-white';
    return 'bg-gray-100 border-gray-300 text-gray-500';
  };

  const openProgressModal = (tender) => {
    setProgressTender(tender);
    setShowProgressModal(true);
  };

  // Debounced search helpers
  useEffect(() => {
    const controller = new AbortController();
    const id = setTimeout(async () => {
      if (!coordinatorSearch) { setCoordinatorResults([]); return; }
      try {
        let res = await apiCall(`/api/admin/employees/search?query=${encodeURIComponent(coordinatorSearch)}&limit=10`).catch(() => null);
        if (!Array.isArray(res)) {
          // Fallback: client-side filter on full list if search endpoint not available
          const all = await apiCall('/api/admin/employees');
          res = (all || []).filter(emp => (emp.name || '').toLowerCase().includes(coordinatorSearch.toLowerCase())).slice(0, 10);
        }
        setCoordinatorResults(res || []);
      } catch (e) { setCoordinatorResults([]); }
    }, 250);
    return () => { clearTimeout(id); controller.abort(); };
  }, [coordinatorSearch]);

  useEffect(() => {
    const controller = new AbortController();
    const id = setTimeout(async () => {
      if (!teamSearch) { setTeamResults([]); return; }
      try {
        let res = await apiCall(`/api/admin/employees/search?query=${encodeURIComponent(teamSearch)}&limit=20`).catch(() => null);
        if (!Array.isArray(res)) {
          const all = await apiCall('/api/admin/employees');
          res = (all || []).filter(emp => (emp.name || '').toLowerCase().includes(teamSearch.toLowerCase())).slice(0, 50);
        }
        setTeamResults(res || []);
      } catch (e) { setTeamResults([]); }
    }, 250);
    return () => { clearTimeout(id); controller.abort(); };
  }, [teamSearch]);

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
            onClick={() => setShowAssignModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <UserCheck size={20} />
            Assign to Vendor
          </button>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tender Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tender Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assignment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Today Update (Log)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Updated By</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Extensions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTenders.map((tender, idx) => (
                <tr key={tender.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{idx + 1}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <button
                      onClick={() => openProgressModal(tender)}
                      className="p-1.5 rounded-md border border-gray-300 hover:bg-gray-100"
                      title="View Progress"
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{tender.category || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{tender.tender_name || tender.title}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{tender.tender_number}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {tender.assigned_vendor_id ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                        Outsourced - {tender.assigned_vendor_name || 'Vendor'}
                      </span>
                    ) : tender.project_coordinator_id ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-sky-100 text-sky-800 border border-sky-200">
                        In-house - {tender.project_coordinator_name || 'Employee'}
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
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
                  <td className="px-6 py-4 text-sm">
                    <button onClick={() => openExtensionModal(tender)} className="px-3 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700">Extensions</button>
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
            
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Column 1 (left) */}
                <div className="space-y-2">
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
                      Tender Category
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
                      Organization Name / Govt Dept
                    </label>
                    <input
                      type="text"
                      value={tenderForm.organization_name}
                      onChange={(e) => setTenderForm({...tenderForm, organization_name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>

                  {/* Budget Amount and Status moved to left column */}
                </div>

                {/* Column 2 (right) */}
                <div className="space-y-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Opening Date
                    </label>
                    <input
                      type="date"
                      value={tenderForm.opening_date}
                      onChange={(e) => setTenderForm({...tenderForm, opening_date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus-border-transparent"
                    />
                  </div>

                  {/* All date fields grouped here */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Published Date</label>
                    <input
                      type="date"
                      value={tenderForm.published_date}
                      onChange={(e) => setTenderForm({...tenderForm, published_date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus-border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Query Submission Date</label>
                    <input
                      type="date"
                      value={tenderForm.query_submission_date}
                      onChange={(e) => setTenderForm({...tenderForm, query_submission_date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus-border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Appendix A/B Submission Date</label>
                    <input
                      type="date"
                      value={tenderForm.appendix_ab_submission_date}
                      onChange={(e) => setTenderForm({...tenderForm, appendix_ab_submission_date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus-border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">RFP Date</label>
                    <input
                      type="date"
                      value={tenderForm.rfp_date}
                      onChange={(e) => setTenderForm({...tenderForm, rfp_date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus-border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Submission Deadline *</label>
                    <input
                      type="date"
                      value={tenderForm.submission_deadline}
                      onChange={(e) => setTenderForm({...tenderForm, submission_deadline: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus-border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">RFQ Date</label>
                    <input
                      type="date"
                      value={tenderForm.rfq_date}
                      onChange={(e) => setTenderForm({...tenderForm, rfq_date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus-border-transparent"
                    />
                  </div>

                  {/* Non-date fields below */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <input
                      type="text"
                      value={tenderForm.location}
                      onChange={(e) => setTenderForm({...tenderForm, location: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus-border-transparent"
                      placeholder="City, State"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                    <input
                      type="text"
                      value={tenderForm.contact_person}
                      onChange={(e) => setTenderForm({...tenderForm, contact_person: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus-border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                    <input
                      type="email"
                      value={tenderForm.contact_email}
                      onChange={(e) => setTenderForm({ ...tenderForm, contact_email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus-border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
                    <input
                      type="text"
                      value={tenderForm.contact_phone}
                      onChange={(e) => setTenderForm({ ...tenderForm, contact_phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus-border-transparent"
                    />
                  </div>

                  {/* Row: Project Coordinator (left) and Project Team (right) */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Project Coordinator *</label>
                    <input
                      type="text"
                      value={coordinatorSearch}
                      onChange={(e) => setCoordinatorSearch(e.target.value)}
                      placeholder="Search employee..."
                      className="mb-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus-border-transparent"
                    />
                    {coordinatorResults.length > 0 && (
                      <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg max-h-48 overflow-auto shadow">
                        {coordinatorResults.map(emp => (
                          <button
                            key={emp.id}
                            type="button"
                            onClick={() => { setTenderForm({ ...tenderForm, project_coordinator_id: emp.id }); setCoordinatorSearch(emp.name); setCoordinatorResults([]); }}
                            className="w-full text-left px-3 py-2 hover:bg-gray-100"
                          >
                            {emp.name}
                          </button>
                        ))}
                      </div>
                    )}
                    {tenderForm.project_coordinator_id && (
                      <div className="mt-2">
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-green-50 text-green-700 border border-green-200 rounded">
                          {employees.find(emp => emp.id === tenderForm.project_coordinator_id)?.name || coordinatorSearch}
                        </span>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Project Team (select multiple)</label>
                    <input
                      type="text"
                      value={teamSearch}
                      onChange={(e) => setTeamSearch(e.target.value)}
                      placeholder="Search team members..."
                      className="mb-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus-border-transparent"
                    />
                    {teamResults.length > 0 && (
                    <div className="w-full px-3 py-2 border border-gray-300 rounded-lg h-28 overflow-auto">
                      {teamResults.map(emp => {
                        const checked = (tenderForm.project_team_ids || []).includes(emp.id);
                        return (
                          <label key={emp.id} className="flex items-center gap-2 py-1">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                const next = new Set(tenderForm.project_team_ids || []);
                                if (e.target.checked) next.add(emp.id); else next.delete(emp.id);
                                setTenderForm({ ...tenderForm, project_team_ids: Array.from(next) });
                              }}
                            />
                            <span>{emp.name}</span>
                          </label>
                        );
                      })}
                    </div>
                    )}
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
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={tenderForm.description}
                  onChange={(e) => setTenderForm({...tenderForm, description: e.target.value})}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus-border-transparent"
                  placeholder="Detailed description of the tender..."
                />
              </div>

              {/* Removed: Eligibility Criteria and Documents Required */}
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
      )}

      {/* Extensions Modal */}
      {showExtensionModal && selectedTender && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Manage Extensions - {selectedTender.tender_number}</h3>
              <button onClick={() => setShowExtensionModal(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Add Extension</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <select value={extensionForm.date_field} onChange={(e)=>setExtensionForm({...extensionForm, date_field: e.target.value})} className="px-3 py-2 border rounded">
                    <option value="published_date">Published Date</option>
                    <option value="query_submission_date">Query Submission Date</option>
                    <option value="appendix_ab_submission_date">Appendix A/B Submission Date</option>
                    <option value="rfp_date">RFP Date</option>
                    <option value="submission_deadline">Submission Deadline</option>
                    <option value="rfq_date">RFQ Date</option>
                    <option value="opening_date">Opening Date</option>
                  </select>
                  <input type="date" value={extensionForm.new_date} onChange={(e)=>setExtensionForm({...extensionForm, new_date: e.target.value})} className="px-3 py-2 border rounded"/>
                  <input type="text" placeholder="Reason (optional)" value={extensionForm.reason} onChange={(e)=>setExtensionForm({...extensionForm, reason: e.target.value})} className="px-3 py-2 border rounded"/>
                </div>
                <div className="mt-3">
                  <button onClick={submitExtension} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Save Extension</button>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Extension Log</h4>
                <div className="border rounded">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left">Date Field</th>
                        <th className="px-3 py-2 text-left">Old</th>
                        <th className="px-3 py-2 text-left">New</th>
                        <th className="px-3 py-2 text-left">Reason</th>
                        <th className="px-3 py-2 text-left">When</th>
                      </tr>
                    </thead>
                    <tbody>
                      {extensionLogs.length === 0 && (
                        <tr><td colSpan={5} className="px-3 py-3 text-center text-gray-500">No extensions yet</td></tr>
                      )}
                      {extensionLogs.map((log)=> (
                        <tr key={log.id} className="border-t">
                          <td className="px-3 py-2">{log.date_field}</td>
                          <td className="px-3 py-2">{log.old_date ? new Date(log.old_date).toLocaleDateString() : '-'}</td>
                          <td className="px-3 py-2">{log.new_date ? new Date(log.new_date).toLocaleDateString() : '-'}</td>
                          <td className="px-3 py-2">{log.reason || '-'}</td>
                          <td className="px-3 py-2">{log.created_at ? new Date(log.created_at).toLocaleString() : ''}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50 flex justify-end">
              <button onClick={()=>setShowExtensionModal(false)} className="px-4 py-2 bg-gray-200 rounded">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Assign to Vendor Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-xl">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Assign Tender to Vendor</h3>
              <button onClick={() => setShowAssignModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Tender</label>
                <select
                  value={assignTenderId}
                  onChange={(e) => setAssignTenderId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  <option value="">-- Choose Tender --</option>
                  {tenders.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.tender_number} - {t.tender_name || t.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assignment Type</label>
                <select
                  value={assignmentType}
                  onChange={(e) => setAssignmentType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  <option value="inhouse">In-house</option>
                  <option value="outsourced">Outsourced</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Vendor</label>
                <select
                  value={assignVendorId}
                  onChange={(e) => setAssignVendorId(e.target.value)}
                  disabled={assignmentType === 'inhouse'}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent ${assignmentType === 'inhouse' ? 'bg-gray-100 cursor-not-allowed opacity-70' : ''}`}
                >
                  <option value="">-- Choose Vendor --</option>
                  {vendors.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.company_name} {v.contact_person ? `- ${v.contact_person}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="p-6 bg-gray-50 flex justify-end gap-3 rounded-b-xl">
              <button
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignVendor}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}

      {showProgressModal && progressTender && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl">
            <div className="p-6 border-b flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Tender Progress</h3>
                <p className="text-sm text-gray-600 mt-1">{progressTender.tender_number} - {progressTender.tender_name || progressTender.title}</p>
              </div>
              <button onClick={() => setShowProgressModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              {(() => {
                const idx = computeStageIndex(progressTender);
                const percent = computeProgressPercent(idx);
                return (
                  <div>
                    <div className="mb-6">
                      <div className="flex items-center justify-between text-sm font-medium text-gray-700 mb-2">
                        <span>Overall Progress</span>
                        <span>{percent}%</span>
                      </div>
                      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div className={`h-3 rounded-full ${idx === steps.length ? 'bg-green-500' : 'bg-blue-600'}`} style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                    <div className="relative">
                      <div className="absolute top-1/2 left-6 right-6 -translate-y-1/2 border-t-2 border-dashed border-gray-300" />
                      <ol className="relative z-10 grid grid-cols-1 md:grid-cols-6 gap-6">
                        {steps.map((label, i) => {
                          const stepIdx = i + 1;
                          const active = stepIdx <= idx;
                          return (
                            <li key={label} className="flex flex-col items-center">
                              <div className={`w-5 h-5 rounded-full border ${getStepClass(stepIdx, idx)}`} />
                              <span className={`mt-2 text-center text-xs ${active ? 'text-gray-900' : 'text-gray-500'}`}>{label}</span>
                            </li>
                          );
                        })}
                      </ol>
                    </div>
                  </div>
                );
              })()}
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

