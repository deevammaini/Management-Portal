import React, { useState, useEffect, useMemo } from 'react';
import { 
  CheckCircle, Download, Search, Filter, Plus, Send, Mail, 
  Eye, Edit, Trash2, Clock, AlertCircle, TrendingUp, 
  BarChart3, FileText, Users, Calendar, MapPin, 
  ArrowUpDown, MoreHorizontal, Save, RefreshCw, 
  Upload, Settings, Bell, Shield, Database, Globe,
  ChevronDown, ChevronUp, X, Check, Star, Flag,
  Briefcase, Building
} from 'lucide-react';
import { apiCall } from '../utils/api';

const FormsView = ({ forms, showNotification }) => {
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [sortField, setSortField] = useState('submitted_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [selectedForms, setSelectedForms] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [templateType, setTemplateType] = useState('');
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [viewMode, setViewMode] = useState('table'); // table, kanban, calendar
  const [savedSearches, setSavedSearches] = useState([]);
  const [showSavedSearches, setShowSavedSearches] = useState(false);
  
  // Template management state
  const [templates, setTemplates] = useState([]);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: '',
    template_type: '',
    category: 'general',
    priority: 'medium',
    form_fields: {},
    status: 'draft'
  });

  // Mock data for enhanced features
  const [enhancedForms, setEnhancedForms] = useState(
    forms.map(form => ({
      ...form,
      status: form.status || 'pending',
      priority: form.priority || 'medium',
      department: form.department || 'Legal',
      assignedTo: form.assignedTo || 'John Doe',
      dueDate: form.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      completionRate: form.completionRate || Math.floor(Math.random() * 100),
      tags: form.tags || ['NDA', 'Vendor'],
      notes: form.notes || '',
      lastActivity: form.lastActivity || new Date(),
      workflowStep: form.workflowStep || 'Review',
      riskLevel: form.riskLevel || 'low'
    }))
  );

  // Calculate analytics
  const analytics = useMemo(() => {
    const total = enhancedForms.length;
    const pending = enhancedForms.filter(f => f.status === 'pending').length;
    const approved = enhancedForms.filter(f => f.status === 'approved').length;
    const rejected = enhancedForms.filter(f => f.status === 'rejected').length;
    const overdue = enhancedForms.filter(f => new Date(f.dueDate) < new Date() && f.status !== 'approved').length;
    
    const avgProcessingTime = enhancedForms.reduce((acc, form) => {
      const submitted = new Date(form.submitted_at);
      const processed = form.processed_at ? new Date(form.processed_at) : new Date();
      return acc + (processed - submitted) / (1000 * 60 * 60 * 24); // days
    }, 0) / total;

    const completionRate = total > 0 ? (approved / total) * 100 : 0;

    return {
      total,
      pending,
      approved,
      rejected,
      overdue,
      avgProcessingTime: Math.round(avgProcessingTime * 10) / 10,
      completionRate: Math.round(completionRate)
    };
  }, [enhancedForms]);

  // Load templates on component mount
  useEffect(() => {
    loadTemplates();
  }, []);

  // Template management functions
  const loadTemplates = async () => {
    try {
      const response = await apiCall('/api/admin/templates', 'GET');
      if (response.success) {
        setTemplates(response.templates || []);
      } else {
        showNotification('Failed to load templates', 'error');
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      showNotification('Failed to load templates', 'error');
    }
  };

  const handleCreateTemplate = async () => {
    try {
      const templateData = {
        ...templateForm,
        template_type: templateType,
        form_fields: {
          fields: [
            { name: 'company_name', type: 'text', required: true, label: 'Company Name' },
            { name: 'contact_person', type: 'text', required: true, label: 'Contact Person' },
            { name: 'email', type: 'email', required: true, label: 'Email' },
            { name: 'phone', type: 'tel', required: false, label: 'Phone Number' },
            { name: 'address', type: 'textarea', required: false, label: 'Address' }
          ]
        }
      };

      const response = await apiCall('/api/admin/templates', 'POST', templateData);
      if (response.success) {
        showNotification('Template created successfully!', 'success');
        setShowCreateTemplate(false);
        setTemplateType('');
        setTemplateForm({
          name: '',
          description: '',
          template_type: '',
          category: 'general',
          priority: 'medium',
          form_fields: {},
          status: 'draft'
        });
        loadTemplates(); // Reload templates
      } else {
        showNotification(response.error || 'Failed to create template', 'error');
      }
    } catch (error) {
      console.error('Error creating template:', error);
      showNotification('Failed to create template', 'error');
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      try {
        const response = await apiCall(`/api/admin/templates/${templateId}`, 'DELETE');
        if (response.success) {
          showNotification('Template deleted successfully!', 'success');
          loadTemplates(); // Reload templates
        } else {
          showNotification(response.error || 'Failed to delete template', 'error');
        }
      } catch (error) {
        console.error('Error deleting template:', error);
        showNotification('Failed to delete template', 'error');
      }
    }
  };

  // Enhanced filtering and sorting
  const filteredAndSortedForms = useMemo(() => {
    return enhancedForms
      .filter(form => {
        const matchesSearch = 
          form.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          form.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          form.reference_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          form.assignedTo?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = statusFilter === 'all' || form.status === statusFilter;
        const matchesDepartment = departmentFilter === 'all' || form.department === departmentFilter;
        const matchesPriority = priorityFilter === 'all' || form.priority === priorityFilter;
        
        let matchesDate = true;
        if (dateRange !== 'all') {
          const now = new Date();
          const formDate = new Date(form.submitted_at);
          switch (dateRange) {
            case 'today':
              matchesDate = formDate.toDateString() === now.toDateString();
              break;
            case 'week':
              matchesDate = (now - formDate) <= 7 * 24 * 60 * 60 * 1000;
              break;
            case 'month':
              matchesDate = (now - formDate) <= 30 * 24 * 60 * 60 * 1000;
              break;
          }
        }
        
        return matchesSearch && matchesStatus && matchesDepartment && matchesPriority && matchesDate;
      })
      .sort((a, b) => {
        let aValue = a[sortField];
        let bValue = b[sortField];
        
        if (sortField === 'submitted_at' || sortField === 'dueDate' || sortField === 'lastActivity') {
          aValue = new Date(aValue);
          bValue = new Date(bValue);
        }
        
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
  }, [enhancedForms, searchTerm, statusFilter, departmentFilter, priorityFilter, dateRange, sortField, sortDirection]);

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
      setLoading(true);
      switch (action) {
        case 'approve':
          await apiCall('/api/admin/bulk-approve-forms', {
            method: 'POST',
            body: JSON.stringify({ formIds: selectedForms })
          });
          showNotification(`${selectedForms.length} forms approved successfully`, 'success');
          break;
        case 'reject':
          await apiCall('/api/admin/bulk-reject-forms', {
            method: 'POST',
            body: JSON.stringify({ formIds: selectedForms })
          });
          showNotification(`${selectedForms.length} forms rejected`, 'success');
          break;
        case 'download':
          showNotification('Bulk download initiated', 'info');
          break;
        case 'email':
          showNotification('Bulk email sent', 'success');
          break;
        case 'export':
          exportSelectedForms();
          break;
        case 'assign':
          showNotification('Bulk assignment feature coming soon', 'info');
          break;
      }
      setSelectedForms([]);
    } catch (error) {
      showNotification('Bulk action failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const exportSelectedForms = () => {
    const selectedData = filteredAndSortedForms.filter(f => selectedForms.includes(f.id));
    const csvContent = [
      ['Company', 'Email', 'Status', 'Priority', 'Department', 'Submitted Date', 'Due Date'],
      ...selectedData.map(form => [
        form.company_name,
        form.email,
        form.status,
        form.priority,
        form.department,
        new Date(form.submitted_at).toLocaleDateString(),
        new Date(form.dueDate).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `forms-export-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showNotification('Forms exported successfully', 'success');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-700 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'rejected': return 'bg-red-100 text-red-700 border-red-200';
      case 'in_review': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'low': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const saveSearch = () => {
    const searchConfig = {
      name: `Search ${new Date().toLocaleString()}`,
      filters: {
        searchTerm,
        statusFilter,
        departmentFilter,
        priorityFilter,
        dateRange
      }
    };
    setSavedSearches(prev => [...prev, searchConfig]);
    showNotification('Search saved successfully', 'success');
  };

  const loadSavedSearch = (search) => {
    setSearchTerm(search.filters.searchTerm);
    setStatusFilter(search.filters.statusFilter);
    setDepartmentFilter(search.filters.departmentFilter);
    setPriorityFilter(search.filters.priorityFilter);
    setDateRange(search.filters.dateRange);
    showNotification('Search loaded successfully', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header with Analytics */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Forms Management</h2>
          <p className="text-gray-600 mt-1">Comprehensive forms processing and workflow management</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setShowAnalytics(!showAnalytics);
              if (showAnalytics) {
                setShowTemplates(false); // Hide templates when showing analytics
              }
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              showAnalytics 
                ? 'bg-blue-500 text-white' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <BarChart3 size={16} />
            Analytics
          </button>
          <button
            onClick={() => {
              setShowTemplates(!showTemplates);
              if (!showTemplates) {
                loadTemplates(); // Load templates when opening the panel
                setShowAnalytics(false); // Hide analytics when showing templates
              }
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              showTemplates 
                ? 'bg-blue-500 text-white' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <FileText size={16} />
            Templates
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

      {/* Analytics Dashboard */}
      {showAnalytics && !showTemplates && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Forms</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.total}</p>
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
                <p className="text-2xl font-bold text-yellow-600">{analytics.pending}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="text-yellow-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                <p className="text-2xl font-bold text-green-600">{analytics.completionRate}%</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="text-green-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Processing</p>
                <p className="text-2xl font-bold text-purple-600">{analytics.avgProcessingTime}d</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="text-purple-600" size={24} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Actions Panel */}
      {showBulkActions && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Bulk Actions</h3>
            <span className="text-sm text-gray-600">{selectedForms.length} forms selected</span>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => handleBulkAction('approve')}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              <Check size={16} />
              Approve Selected
            </button>
            <button
              onClick={() => handleBulkAction('reject')}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              <X size={16} />
              Reject Selected
            </button>
            <button
              onClick={() => handleBulkAction('download')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Download size={16} />
              Download Selected
            </button>
            <button
              onClick={() => handleBulkAction('email')}
              className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
            >
              <Mail size={16} />
              Send Email
            </button>
            <button
              onClick={() => handleBulkAction('export')}
              className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              <Upload size={16} />
              Export CSV
            </button>
            <button
              onClick={() => handleBulkAction('assign')}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
            >
              <Users size={16} />
              Assign to User
            </button>
          </div>
        </div>
      )}

      {/* Main Forms Content - Only show when templates are not being viewed */}
      {!showTemplates && (
        <>
          {/* Advanced Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-6 border-b">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by company, email, reference number, or assigned user..."
                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Filter size={16} />
                Filters
                {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              <button
                onClick={() => setShowSavedSearches(!showSavedSearches)}
                className="flex items-center gap-2 px-4 py-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Save size={16} />
                Saved
              </button>
              <button
                onClick={saveSearch}
                className="flex items-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Save size={16} />
                Save Search
              </button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="in_review">In Review</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                  <select
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="all">All Departments</option>
                    <option value="Legal">Legal</option>
                    <option value="Finance">Finance</option>
                    <option value="Operations">Operations</option>
                    <option value="IT">IT</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="all">All Priorities</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Saved Searches */}
          {showSavedSearches && (
            <div className="mt-4 pt-4 border-t">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Saved Searches</h3>
              <div className="space-y-2">
                {savedSearches.map((search, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">{search.name}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => loadSavedSearch(search)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Load
                      </button>
                      <button
                        onClick={() => setSavedSearches(prev => prev.filter((_, i) => i !== index))}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
                {savedSearches.length === 0 && (
                  <p className="text-sm text-gray-500">No saved searches yet</p>
                )}
              </div>
            </div>
          )}
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
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center gap-2">
                    Status
                    <ArrowUpDown size={14} />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Department</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Assigned To</th>
                <th 
                  className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('submitted_at')}
                >
                  <div className="flex items-center gap-2">
                    Submitted
                    <ArrowUpDown size={14} />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('dueDate')}
                >
                  <div className="flex items-center gap-2">
                    Due Date
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
                  <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-semibold">{form.company_name?.[0] || '?'}</span>
                      </div>
                      <div>
                        <div className="font-medium">{form.company_name}</div>
                        <div className="text-sm text-gray-500">{form.email}</div>
                        <div className="text-xs text-gray-400">{form.reference_number}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium">{form.contact_person || 'N/A'}</div>
                      <div className="text-sm text-gray-500">{form.phone || 'N/A'}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(form.status)}`}>
                      {form.status === 'approved' && <CheckCircle size={12} />}
                      {form.status === 'pending' && <Clock size={12} />}
                      {form.status === 'rejected' && <X size={12} />}
                      {form.status === 'in_review' && <Eye size={12} />}
                      {form.status?.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(form.priority)}`}>
                      <Flag size={12} />
                      {form.priority?.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">{form.department}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-purple-600 text-xs font-semibold">
                          {form.assignedTo?.[0] || '?'}
                        </span>
                      </div>
                      <span className="text-sm text-gray-600">{form.assignedTo}</span>
                  </div>
                </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600">
                  {new Date(form.submitted_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`text-sm ${new Date(form.dueDate) < new Date() ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                      {new Date(form.dueDate).toLocaleDateString()}
                      {new Date(form.dueDate) < new Date() && (
                        <div className="text-xs text-red-500">Overdue</div>
                      )}
                    </div>
                </td>
                <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                  <button
                        onClick={() => window.open(`http://localhost:8000/api/admin/download-completed-nda/${form.id}`, '_blank')}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Download"
                  >
                    <Download size={16} />
                      </button>
                      <button
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                        title="More Actions"
                      >
                        <MoreHorizontal size={16} />
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
              {searchTerm || statusFilter !== 'all' ? 'No forms match your criteria' : 'No forms submitted yet'}
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria to find what you\'re looking for.'
                : 'Forms will appear here once vendors complete the submission process.'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <div className="flex gap-3 justify-center">
                <button className="flex items-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors">
                  <Send size={16} />
                  Send First Form
                </button>
                <button 
                  onClick={() => setShowCreateTemplate(true)}
                  className="flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <FileText size={16} />
                  Create Template
                </button>
              </div>
            )}
          </div>
        )}
        </>
      )}

      {/* Form Templates Panel */}
      {showTemplates && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Form Templates</h3>
            <button
              onClick={() => setShowCreateTemplate(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Plus size={16} />
              Create Template
            </button>
          </div>
          
          {templates.length === 0 ? (
            <div className="text-center py-8">
              <FileText size={48} className="mx-auto text-gray-400 mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">No templates created yet</h4>
              <p className="text-gray-500 mb-4">Create your first template to get started</p>
              <button
                onClick={() => setShowCreateTemplate(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Create Template
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => (
                <div key={template.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      template.template_type === 'NDA' ? 'bg-blue-100' :
                      template.template_type === 'Contract' ? 'bg-green-100' :
                      template.template_type === 'Employment' ? 'bg-purple-100' :
                      template.template_type === 'Vendor' ? 'bg-orange-100' :
                      template.template_type === 'Compliance' ? 'bg-red-100' :
                      'bg-gray-100'
                    }`}>
                      <FileText className={`${
                        template.template_type === 'NDA' ? 'text-blue-600' :
                        template.template_type === 'Contract' ? 'text-green-600' :
                        template.template_type === 'Employment' ? 'text-purple-600' :
                        template.template_type === 'Vendor' ? 'text-orange-600' :
                        template.template_type === 'Compliance' ? 'text-red-600' :
                        'text-gray-600'
                      }`} size={20} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{template.name}</h4>
                      <p className="text-sm text-gray-500">{template.description || 'No description'}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          template.status === 'Active' ? 'bg-green-100 text-green-800' :
                          template.status === 'Draft' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {template.status}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          template.priority === 'High' ? 'bg-red-100 text-red-800' :
                          template.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          template.priority === 'Low' ? 'bg-green-100 text-green-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {template.priority}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="flex-1 px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600">
                      Use Template
                    </button>
                    <button 
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="px-3 py-1 text-sm border border-red-300 text-red-600 rounded hover:bg-red-50"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    Created by {template.created_by_name || 'Unknown'} • {new Date(template.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Template Modal */}
      {showCreateTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b flex-shrink-0">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">Create Form Template</h3>
                <button
                  onClick={() => {
                    setShowCreateTemplate(false);
                    setTemplateType('');
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-semibold mb-4">Choose Template Type</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div 
                      onClick={() => setTemplateType('nda')}
                      className={`border-2 rounded-lg p-6 cursor-pointer transition-all hover:shadow-md ${
                        templateType === 'nda' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <FileText className="text-blue-600" size={24} />
                        </div>
                        <div>
                          <h5 className="font-semibold">NDA Agreement</h5>
                          <p className="text-sm text-gray-500">Non-Disclosure Agreement</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">Standard confidentiality agreement for vendors and partners</p>
                    </div>

                    <div 
                      onClick={() => setTemplateType('contract')}
                      className={`border-2 rounded-lg p-6 cursor-pointer transition-all hover:shadow-md ${
                        templateType === 'contract' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                          <Briefcase className="text-green-600" size={24} />
                        </div>
                        <div>
                          <h5 className="font-semibold">Service Contract</h5>
                          <p className="text-sm text-gray-500">Vendor Service Agreement</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">Comprehensive service contract for vendor partnerships</p>
                    </div>

                    <div 
                      onClick={() => setTemplateType('employment')}
                      className={`border-2 rounded-lg p-6 cursor-pointer transition-all hover:shadow-md ${
                        templateType === 'employment' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                          <Users className="text-purple-600" size={24} />
                        </div>
                        <div>
                          <h5 className="font-semibold">Employment Form</h5>
                          <p className="text-sm text-gray-500">Employee Onboarding</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">Employee information and agreement forms</p>
                    </div>

                    <div 
                      onClick={() => setTemplateType('vendor')}
                      className={`border-2 rounded-lg p-6 cursor-pointer transition-all hover:shadow-md ${
                        templateType === 'vendor' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                          <Building className="text-orange-600" size={24} />
                        </div>
                        <div>
                          <h5 className="font-semibold">Vendor Registration</h5>
                          <p className="text-sm text-gray-500">Vendor Onboarding</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">Vendor registration and qualification forms</p>
                    </div>

                    <div 
                      onClick={() => setTemplateType('compliance')}
                      className={`border-2 rounded-lg p-6 cursor-pointer transition-all hover:shadow-md ${
                        templateType === 'compliance' ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                          <Shield className="text-red-600" size={24} />
                        </div>
                        <div>
                          <h5 className="font-semibold">Compliance Form</h5>
                          <p className="text-sm text-gray-500">Regulatory Compliance</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">Compliance and regulatory requirement forms</p>
                    </div>

                    <div 
                      onClick={() => setTemplateType('custom')}
                      className={`border-2 rounded-lg p-6 cursor-pointer transition-all hover:shadow-md ${
                        templateType === 'custom' ? 'border-gray-500 bg-gray-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Plus className="text-gray-600" size={24} />
                        </div>
                        <div>
                          <h5 className="font-semibold">Custom Form</h5>
                          <p className="text-sm text-gray-500">Build from Scratch</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">Create a completely custom form template</p>
                    </div>
                  </div>
                </div>

                {templateType && (
                  <div className="border-t pt-6">
                    <h4 className="text-lg font-semibold mb-4">Template Configuration</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Template Name</label>
                        <input
                          type="text"
                          value={templateForm.name}
                          onChange={(e) => setTemplateForm({...templateForm, name: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder={`Enter ${templateType} template name`}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                        <textarea
                          rows={3}
                          value={templateForm.description}
                          onChange={(e) => setTemplateForm({...templateForm, description: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter template description"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                          <select 
                            value={templateForm.category}
                            onChange={(e) => setTemplateForm({...templateForm, category: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="general">General</option>
                            <option value="legal">Legal Documents</option>
                            <option value="hr">Human Resources</option>
                            <option value="vendor">Vendor Management</option>
                            <option value="compliance">Compliance</option>
                            <option value="custom">Custom</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                          <select 
                            value={templateForm.priority}
                            onChange={(e) => setTemplateForm({...templateForm, priority: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="critical">Critical</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Form Fields</label>
                        <div className="border border-gray-200 rounded-lg p-4">
                          <p className="text-sm text-gray-500 mb-3">Configure form fields for this template:</p>
                          <div className="space-y-2">
                            {templateType === 'nda' && (
                              <>
                                <div className="flex items-center gap-2">
                                  <input type="checkbox" defaultChecked className="rounded" />
                                  <span className="text-sm">Company Name</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <input type="checkbox" defaultChecked className="rounded" />
                                  <span className="text-sm">Contact Person</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <input type="checkbox" defaultChecked className="rounded" />
                                  <span className="text-sm">Email Address</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <input type="checkbox" defaultChecked className="rounded" />
                                  <span className="text-sm">Phone Number</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <input type="checkbox" defaultChecked className="rounded" />
                                  <span className="text-sm">Company Address</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <input type="checkbox" defaultChecked className="rounded" />
                                  <span className="text-sm">Confidentiality Period</span>
                                </div>
                              </>
                            )}
                            {templateType === 'contract' && (
                              <>
                                <div className="flex items-center gap-2">
                                  <input type="checkbox" defaultChecked className="rounded" />
                                  <span className="text-sm">Service Description</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <input type="checkbox" defaultChecked className="rounded" />
                                  <span className="text-sm">Contract Duration</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <input type="checkbox" defaultChecked className="rounded" />
                                  <span className="text-sm">Payment Terms</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <input type="checkbox" defaultChecked className="rounded" />
                                  <span className="text-sm">Deliverables</span>
                                </div>
                              </>
                            )}
                            {templateType === 'employment' && (
                              <>
                                <div className="flex items-center gap-2">
                                  <input type="checkbox" defaultChecked className="rounded" />
                                  <span className="text-sm">Personal Information</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <input type="checkbox" defaultChecked className="rounded" />
                                  <span className="text-sm">Employment Details</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <input type="checkbox" defaultChecked className="rounded" />
                                  <span className="text-sm">Emergency Contact</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <input type="checkbox" defaultChecked className="rounded" />
                                  <span className="text-sm">Bank Details</span>
                                </div>
                              </>
                            )}
                            {templateType === 'custom' && (
                              <div className="text-center py-4">
                                <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                                  Add Custom Fields
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
            </div>
            <div className="p-6 border-t flex-shrink-0">
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowCreateTemplate(false);
                    setTemplateType('');
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTemplate}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  disabled={!templateType || !templateForm.name}
                >
                  Create Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormsView;
