import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, Users, Target, Calendar, MapPin, Mail, Phone, 
  Building, User, Clock, CheckCircle, AlertCircle, 
  Edit, Trash2, Eye, Filter, ChevronDown,
  Send, Bell, FileText, TrendingUp, BarChart3, X
} from 'lucide-react';
import { apiCall } from '../utils/api';
import { useSocket } from '../contexts/SocketContext';

const GenerateLeadsView = ({ showNotification, user, isEmployee = false }) => {
  const socket = useSocket();
  
  // Helper function to format datetime strings
  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return 'Not available';
    
    console.log('Formatting datetime:', dateTimeString, 'Type:', typeof dateTimeString);
    
    try {
      // Handle different possible formats
      let date, time;
      
      if (typeof dateTimeString === 'string') {
        if (dateTimeString.includes(' ')) {
          // Format: YYYY-MM-DD HH:MM:SS
          [date, time] = dateTimeString.split(' ');
        } else if (dateTimeString.includes('T')) {
          // Format: YYYY-MM-DDTHH:MM:SS
          [date, time] = dateTimeString.split('T');
        } else {
          // Try to parse as a date string
          const parsedDate = new Date(dateTimeString);
          if (!isNaN(parsedDate.getTime())) {
            const year = parsedDate.getFullYear();
            const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
            const day = String(parsedDate.getDate()).padStart(2, '0');
            const hours = String(parsedDate.getHours()).padStart(2, '0');
            const minutes = String(parsedDate.getMinutes()).padStart(2, '0');
            const seconds = String(parsedDate.getSeconds()).padStart(2, '0');
            return `${month}/${day}/${year}, ${hours}:${minutes}:${seconds}`;
          }
          return 'Invalid format';
        }
        
        if (date && time) {
          const [year, month, day] = date.split('-');
          const [hours, minutes, seconds] = time.split(':');
          
          if (year && month && day && hours && minutes && seconds) {
            return `${month}/${day}/${year}, ${hours}:${minutes}:${seconds}`;
          }
        }
      }
      
      return 'Invalid format';
    } catch (error) {
      console.error('Error formatting datetime:', error);
      return 'Format error';
    }
  };
  const [leads, setLeads] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [scheduledEmails, setScheduledEmails] = useState([]);
  const [showAddCompanyModal, setShowAddCompanyModal] = useState(false);
  const [showScheduleEmailModal, setShowScheduleEmailModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [companyForm, setCompanyForm] = useState({
    company_name: '',
    email: '',
    contact_person: '',
    phone: '',
    industry: '',
    website: '',
    email_type: 'intro'
  });
  const [scheduleForm, setScheduleForm] = useState({
    scheduled_time: '',
    company_id: '',
    email_type: 'intro'
  });
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [industryFilter, setIndustryFilter] = useState('all');
  const [emailTypeFilter, setEmailTypeFilter] = useState('all');
  const [showBulkScheduleModal, setShowBulkScheduleModal] = useState(false);
  const [bulkScheduleForm, setBulkScheduleForm] = useState({
    scheduled_time: '',
    batch_size: 10,
    batch_interval: 10,
    email_type: 'intro'
  });
  const [selectedLead, setSelectedLead] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [employeeFilter, setEmployeeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showProgressUpdates, setShowProgressUpdates] = useState(false);
  const [progressUpdates, setProgressUpdates] = useState([]);
  const [selectedLeadForUpdates, setSelectedLeadForUpdates] = useState(null);

  const fetchScheduledEmails = useCallback(async () => {
    try {
      const emailsData = await apiCall('/api/admin/scheduled-emails');
      setScheduledEmails(emailsData?.emails || []);
    } catch (error) {
      console.error('Error fetching scheduled emails:', error);
    }
  }, [setScheduledEmails]);

  // Form states
  const [leadForm, setLeadForm] = useState({
    company_name: '',
    project_name: '',
    key_account_manager: '',
    project_coordinator: '',
    client_end_manager: '',
    client_email: '',
    client_phone: '',
    location: '',
    start_date: '',
    expected_project_start_date: '',
    last_interacted_date: '',
    lead_status: 'new',
    lead_source: '',
    remarks: '',
    priority: 'medium',
    estimated_value: '',
    industry: '',
    // Assignment fields
    assign_to_employee: false,
    employee_id: '',
    due_date: '',
    assignment_notes: ''
  });

  const [assignEmployeeDetails, setAssignEmployeeDetails] = useState(null);
  const [loadingEmployeeDetails, setLoadingEmployeeDetails] = useState(false);
  const [assignForm, setAssignForm] = useState({
    employee_id: '',
    due_date: '',
    notes: ''
  });
  const [employeeSearchMode, setEmployeeSearchMode] = useState('manual'); // Only manual mode
  const [employeeSearchId, setEmployeeSearchId] = useState('');
  const [searchedEmployee, setSearchedEmployee] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  // Auto-search employee when ID is entered (client-side like tickets)
  useEffect(() => {
    if (employeeSearchId && employees.length > 0) {
      const employee = employees.find(emp => emp.employeeId === employeeSearchId);
      if (employee) {
        setSearchedEmployee(employee);
        setLeadForm({...leadForm, employee_id: employee.id});
      } else {
        setSearchedEmployee(null);
        setLeadForm({...leadForm, employee_id: ''});
      }
    } else {
      setSearchedEmployee(null);
      setLeadForm({...leadForm, employee_id: ''});
    }
  }, [employeeSearchId, employees]);

  // WebSocket listeners for real-time email updates
  useEffect(() => {
    if (socket) {
      // Listen for email status updates
      socket.on('email_sent', (data) => {
        console.log('📧 Email sent notification:', data);
        // Refresh scheduled emails data
        fetchScheduledEmails();
        // Show success notification
        showNotification({
          type: 'success',
          message: `Email sent successfully to ${data.company_name}!`
        });
      });

      socket.on('email_failed', (data) => {
        console.log('❌ Email failed notification:', data);
        // Refresh scheduled emails data
        fetchScheduledEmails();
        // Show error notification
        showNotification({
          type: 'error',
          message: `Failed to send email to ${data.company_name}: ${data.error_message}`
        });
      });

      return () => {
        socket.off('email_sent');
        socket.off('email_failed');
      };
    }
  }, [socket, showNotification, fetchScheduledEmails]);

  // Fetch employee details when employee ID changes in assign form
  useEffect(() => {
    const fetchEmployeeDetails = async () => {
      if (assignForm.employee_id && assignForm.employee_id.trim() !== '') {
        setLoadingEmployeeDetails(true);
        try {
          const response = await apiCall(`/api/admin/employees/${assignForm.employee_id}/details`, 'GET');
          if (response && response.name) {
            setAssignEmployeeDetails(response);
          } else {
            setAssignEmployeeDetails(null);
          }
        } catch (error) {
          console.error('Error fetching employee details:', error);
          setAssignEmployeeDetails(null);
        } finally {
          setLoadingEmployeeDetails(false);
        }
      } else {
        setAssignEmployeeDetails(null);
      }
    };

    fetchEmployeeDetails();
  }, [assignForm.employee_id]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      if (isEmployee) {
        // For employees, only load assigned leads
        const leadsData = await apiCall(`/api/employee/assigned-leads?employee_id=${user?.id}`);
        console.log('🔍 Debug: Employee assigned leads data received:', leadsData);
        // The employee endpoint returns {success: true, leads: [...]}
        setLeads(leadsData?.leads || []);
        setEmployees([]);
        setCompanies([]);
        setScheduledEmails([]);
      } else {
        // For admins, load all data
        const [leadsData, employeesData, companiesData, emailsData] = await Promise.all([
          apiCall('/api/admin/leads'),
          apiCall('/api/admin/employees'),
          apiCall('/api/admin/companies'),
          apiCall('/api/admin/scheduled-emails')
        ]);
        
        console.log('🔍 Debug: Leads data received:', leadsData);
        console.log('🔍 Debug: Priority values:', leadsData?.map(lead => ({ id: lead.id, priority: lead.priority })));
        
        setLeads(leadsData || []);
        setEmployees(employeesData || []);
        setCompanies(companiesData?.companies || []);
        setScheduledEmails(emailsData?.emails || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      showNotification('Failed to load data', 'error');
      // Ensure arrays are never null
      setLeads([]);
      setEmployees([]);
      setCompanies([]);
      setScheduledEmails([]);
    } finally {
      setLoading(false);
    }
  };

  // Company Management Functions
  const handleCreateCompany = async (e) => {
    e.preventDefault();
    try {
      await apiCall('/api/admin/companies', {
        method: 'POST',
        body: JSON.stringify(companyForm)
      });
      
      showNotification('Company created successfully!', 'success');
      setShowAddCompanyModal(false);
      setCompanyForm({
        company_name: '',
        email: '',
        contact_person: '',
        phone: '',
        industry: '',
        website: ''
      });
      loadData();
    } catch (error) {
      console.error('Error creating company:', error);
      showNotification('Failed to create company', 'error');
    }
  };

  const handleDeleteCompany = async (companyId) => {
    if (window.confirm('Are you sure you want to delete this company?')) {
      try {
        await apiCall(`/api/admin/companies/${companyId}`, {
          method: 'DELETE'
        });
        
        showNotification('Company deleted successfully!', 'success');
        loadData();
      } catch (error) {
        console.error('Error deleting company:', error);
        showNotification('Failed to delete company', 'error');
      }
    }
  };

  const handleScheduleEmail = async (e) => {
    e.preventDefault();
    try {
      await apiCall('/api/admin/scheduled-emails', {
        method: 'POST',
        body: JSON.stringify(scheduleForm)
      });
      
      showNotification('Email scheduled successfully!', 'success');
      setShowScheduleEmailModal(false);
      setScheduleForm({
        scheduled_time: '',
        company_id: ''
      });
      loadData();
    } catch (error) {
      console.error('Error scheduling email:', error);
      showNotification('Failed to schedule email', 'error');
    }
  };

  const handleCancelEmail = async (emailId) => {
    if (window.confirm('Are you sure you want to cancel this scheduled email?')) {
      try {
        await apiCall(`/api/admin/scheduled-emails/${emailId}`, {
          method: 'DELETE'
        });
        
        showNotification('Email cancelled successfully!', 'success');
        loadData();
      } catch (error) {
        console.error('Error cancelling email:', error);
        showNotification('Failed to cancel email', 'error');
      }
    }
  };

  const handleSendEmailNow = async (emailId) => {
    try {
      await apiCall(`/api/admin/scheduled-emails/${emailId}/send-now`, {
        method: 'POST'
      });
      
      showNotification('Email sent successfully!', 'success');
      loadData();
    } catch (error) {
      console.error('Error sending email:', error);
      showNotification('Failed to send email', 'error');
    }
  };

  const handleSendAllPendingEmails = async () => {
    if (window.confirm('Are you sure you want to send all pending emails now?')) {
      try {
        await apiCall('/api/admin/scheduled-emails/send-all-pending', {
          method: 'POST'
        });
        
        showNotification('All pending emails sent successfully!', 'success');
        loadData();
      } catch (error) {
        console.error('Error sending all emails:', error);
        showNotification('Failed to send emails', 'error');
      }
    }
  };

  const handleBulkScheduleEmails = async (e) => {
    e.preventDefault();
    try {
      // If there's an attachment, use FormData and direct fetch
      if (bulkScheduleForm.attachment) {
        const formData = new FormData();
        formData.append('company_ids', JSON.stringify(selectedCompanies));
        formData.append('scheduled_time', bulkScheduleForm.scheduled_time);
        formData.append('batch_size', bulkScheduleForm.batch_size.toString());
        formData.append('batch_interval', bulkScheduleForm.batch_interval.toString());
        formData.append('email_type', bulkScheduleForm.email_type || 'intro');
        formData.append('attachment', bulkScheduleForm.attachment);
        
        const response = await fetch('http://localhost:8000/api/admin/scheduled-emails/bulk', {
          method: 'POST',
          body: formData,
          credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.success) {
          const totalBatches = Math.ceil(selectedCompanies.length / bulkScheduleForm.batch_size);
          const totalDuration = (totalBatches - 1) * bulkScheduleForm.batch_interval;
          
          showNotification(
            `${selectedCompanies.length} emails scheduled in ${totalBatches} batches over ${totalDuration} minutes!`, 
            'success'
          );
          setShowBulkScheduleModal(false);
          setSelectedCompanies([]);
          setBulkScheduleForm({ 
            scheduled_time: '', 
            batch_size: 10, 
            batch_interval: 10,
            email_type: 'intro',
            attachment: null
          });
          loadData();
        } else {
          showNotification(data.error || 'Failed to schedule bulk emails', 'error');
        }
      } else {
        // No attachment, use JSON
        const response = await apiCall('/api/admin/scheduled-emails/bulk', {
          method: 'POST',
          body: JSON.stringify({
            company_ids: selectedCompanies,
            scheduled_time: bulkScheduleForm.scheduled_time,
            batch_size: bulkScheduleForm.batch_size,
            batch_interval: bulkScheduleForm.batch_interval,
            email_type: bulkScheduleForm.email_type || 'intro'
          })
        });
        
        const totalBatches = Math.ceil(selectedCompanies.length / bulkScheduleForm.batch_size);
        const totalDuration = (totalBatches - 1) * bulkScheduleForm.batch_interval;
        
        showNotification(
          `${selectedCompanies.length} emails scheduled in ${totalBatches} batches over ${totalDuration} minutes!`, 
          'success'
        );
        setShowBulkScheduleModal(false);
        setSelectedCompanies([]);
        setBulkScheduleForm({ 
          scheduled_time: '', 
          batch_size: 10, 
          batch_interval: 10,
          email_type: 'intro',
          attachment: null
        });
        loadData();
      }
    } catch (error) {
      console.error('Error scheduling bulk emails:', error);
      showNotification('Failed to schedule bulk emails', 'error');
    }
  };

  const handleSelectCompany = (companyId) => {
    setSelectedCompanies(prev => 
      prev.includes(companyId) 
        ? prev.filter(id => id !== companyId)
        : [...prev, companyId]
    );
  };

  const handleSelectAllCompanies = () => {
    const filteredCompanies = getFilteredCompanies();
    if (selectedCompanies.length === filteredCompanies.length) {
      setSelectedCompanies([]);
    } else {
      setSelectedCompanies(filteredCompanies.map(c => c.id));
    }
  };

  const getFilteredCompanies = () => {
    let filtered = companies || [];
    
    if (industryFilter !== 'all') {
      filtered = filtered.filter(company => company.industry === industryFilter);
    }
    
    // Smart email type filtering based on email history
    if (emailTypeFilter !== 'all') {
      filtered = filtered.filter(company => {
        const sentEmailTypes = company.sent_email_types ? company.sent_email_types.split(',') : [];
        
        switch (emailTypeFilter) {
          case 'intro':
            // Show companies that haven't received intro email yet
            return !sentEmailTypes.includes('intro');
            
          case 'first_followup':
            // Show companies that received intro but not first follow-up
            return sentEmailTypes.includes('intro') && !sentEmailTypes.includes('first_followup');
            
          case 'second_followup':
            // Show companies that received first follow-up but not second follow-up
            return sentEmailTypes.includes('first_followup') && !sentEmailTypes.includes('second_followup');
            
          case 'third_followup':
            // Show companies that received second follow-up but not third follow-up
            return sentEmailTypes.includes('second_followup') && !sentEmailTypes.includes('third_followup');
            
          case 'final_followup':
            // Show companies that received third follow-up but not final follow-up
            return sentEmailTypes.includes('third_followup') && !sentEmailTypes.includes('final_followup');
            
          default:
            return true;
        }
      });
    }
    
    return filtered;
  };

  const handleCreateLead = async (e) => {
    e.preventDefault();
    try {
      // First create the lead
      const leadResponse = await apiCall('/api/admin/leads', {
        method: 'POST',
        body: JSON.stringify({
          company_name: leadForm.company_name,
          project_name: leadForm.project_name,
          key_account_manager: leadForm.key_account_manager,
          project_coordinator: leadForm.project_coordinator,
          client_end_manager: leadForm.client_end_manager,
          client_email: leadForm.client_email,
          client_phone: leadForm.client_phone,
          location: leadForm.location,
          start_date: leadForm.start_date,
          expected_project_start_date: leadForm.expected_project_start_date,
          last_interacted_date: leadForm.last_interacted_date,
          lead_status: leadForm.lead_status,
          lead_source: leadForm.lead_source,
          remarks: leadForm.remarks,
          priority: leadForm.priority,
          estimated_value: leadForm.estimated_value,
          industry: leadForm.industry
        })
      });
      
      if (leadResponse.success && leadForm.assign_to_employee && leadForm.employee_id) {
        // If assignment is requested, assign the lead to the employee
        const assignmentResponse = await apiCall(`/api/admin/leads/${leadResponse.lead_id}/assign`, {
          method: 'POST',
          body: JSON.stringify({
            employee_id: leadForm.employee_id,
            due_date: leadForm.due_date,
            notes: leadForm.assignment_notes
          })
        });
        
        if (assignmentResponse.success) {
          showNotification('Lead created and assigned successfully!', 'success');
        } else {
          showNotification('Lead created but assignment failed', 'warning');
        }
      } else {
        showNotification('Lead created successfully!', 'success');
      }
      
      setShowCreateModal(false);
      setLeadForm({
        company_name: '',
        project_name: '',
        key_account_manager: '',
        project_coordinator: '',
        client_end_manager: '',
        client_email: '',
        client_phone: '',
        location: '',
        start_date: '',
        expected_project_start_date: '',
        last_interacted_date: '',
        lead_status: 'new',
        lead_source: '',
        remarks: '',
        priority: 'medium',
        estimated_value: '',
        industry: '',
        assign_to_employee: false,
        employee_id: '',
        due_date: '',
        assignment_notes: ''
      });
      loadData();
    } catch (error) {
      console.error('Error creating lead:', error);
      showNotification('Failed to create lead', 'error');
    }
  };

  const handleAssignLead = async (e) => {
    e.preventDefault();
    try {
      await apiCall(`/api/admin/leads/${selectedLead.id}/assign`, {
        method: 'POST',
        body: JSON.stringify(assignForm)
      });
      
      showNotification('Lead assigned successfully!', 'success');
      setShowAssignModal(false);
      setSelectedLead(null);
      setAssignForm({
        employee_id: '',
        due_date: '',
        notes: ''
      });
      loadData(); // Refresh the leads table to show updated assignment
    } catch (error) {
      console.error('Error assigning lead:', error);
      showNotification('Failed to assign lead', 'error');
    }
  };

  const handleDeleteLead = async (leadId) => {
    if (window.confirm('Are you sure you want to delete this lead?')) {
      try {
        await apiCall(`/api/admin/leads/${leadId}`, {
          method: 'DELETE'
        });
        
        showNotification('Lead deleted successfully!', 'success');
        loadData();
      } catch (error) {
        console.error('Error deleting lead:', error);
        showNotification('Failed to delete lead', 'error');
      }
    }
  };

  const handleViewProgressUpdates = async (lead) => {
    try {
      const response = await apiCall(`/api/admin/leads/${lead.id}/progress-updates`);
      if (response.success && response.updates) {
        setProgressUpdates(response.updates);
        setSelectedLeadForUpdates(lead);
        setShowProgressUpdates(true);
      }
    } catch (error) {
      console.error('Error fetching progress updates:', error);
      showNotification('Failed to load progress updates', 'error');
    }
  };

  const handleUpdateLeadStatus = async (leadId, newStatus) => {
    try {
      await apiCall(`/api/admin/leads/${leadId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      
      showNotification('Lead status updated successfully!', 'success');
      loadData();
    } catch (error) {
      console.error('Error updating lead status:', error);
      showNotification('Failed to update lead status', 'error');
    }
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.project_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.client_email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || lead.lead_status === statusFilter;
    const matchesEmployee = employeeFilter === 'all' || lead.assigned_to?.toString() === employeeFilter;
    
    return matchesSearch && matchesStatus && matchesEmployee;
  });

  const sortedLeads = [...filteredLeads].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];
    
    if (sortBy === 'created_at' || sortBy === 'updated_at') {
      aValue = new Date(aValue);
      bValue = new Date(bValue);
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'contacted': return 'bg-yellow-100 text-yellow-800';
      case 'qualified': return 'bg-green-100 text-green-800';
      case 'proposal': return 'bg-purple-100 text-purple-800';
      case 'negotiation': return 'bg-orange-100 text-orange-800';
      case 'closed_won': return 'bg-green-100 text-green-800';
      case 'closed_lost': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Generate Leads</h1>
          <p className="text-gray-600">{isEmployee ? 'View your assigned leads' : 'Manage and assign leads to employees'}</p>
        </div>
        {!isEmployee && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowEmailModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Mail size={20} />
              Send Email for Lead Generation
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
            >
              <Plus size={20} />
              Create New Lead
            </button>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Leads</p>
              <p className="text-2xl font-bold text-gray-900">{leads.length}</p>
            </div>
            <Target className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">New Leads</p>
              <p className="text-2xl font-bold text-gray-900">
                {leads.filter(lead => lead.lead_status === 'new').length}
              </p>
            </div>
            <Bell className="h-8 w-8 text-yellow-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Assigned Leads</p>
              <p className="text-2xl font-bold text-gray-900">
                {isEmployee 
                  ? leads.length // All leads in employee view are assigned to them
                  : leads.filter(lead => lead.assigned_to).length
                }
              </p>
            </div>
            <Users className="h-8 w-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Closed Won</p>
              <p className="text-2xl font-bold text-gray-900">
                {leads.filter(lead => lead.lead_status === 'closed_won').length}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            <option value="all">All Statuses</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="proposal">Proposal</option>
            <option value="negotiation">Negotiation</option>
            <option value="closed_won">Closed Won</option>
            <option value="closed_lost">Closed Lost</option>
          </select>
          
          {!isEmployee && (
            <select
              value={employeeFilter}
              onChange={(e) => setEmployeeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              <option value="all">All Employees</option>
              {(employees || []).map(employee => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
            </select>
          )}
          
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field);
              setSortOrder(order);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            <option value="created_at-desc">Newest First</option>
            <option value="created_at-asc">Oldest First</option>
            <option value="company_name-asc">Company A-Z</option>
            <option value="company_name-desc">Company Z-A</option>
            <option value="priority-desc">Priority High-Low</option>
            <option value="priority-asc">Priority Low-High</option>
          </select>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Project
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned To
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(sortedLeads || []).map(lead => (
                <tr key={lead.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Building className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {lead.company_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {lead.client_email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {lead.project_name || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {lead.industry || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={lead.lead_status}
                      onChange={(e) => handleUpdateLeadStatus(lead.id, e.target.value)}
                      className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(lead.lead_status)} border-0 focus:ring-2 focus:ring-amber-500`}
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="qualified">Qualified</option>
                      <option value="proposal">Proposal</option>
                      <option value="negotiation">Negotiation</option>
                      <option value="closed_won">Closed Won</option>
                      <option value="closed_lost">Closed Lost</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(lead.priority)}`}>
                      {lead.priority || 'N/A'}
                    </span>
                    {/* Debug: {JSON.stringify({id: lead.id, priority: lead.priority})} */}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {isEmployee ? (
                      <div className="flex items-center">
                        <User className="h-4 w-4 text-green-600 mr-2" />
                        <span className="text-sm font-medium text-green-700">
                          You
                        </span>
                      </div>
                    ) : lead.assigned_to ? (
                      <div className="flex items-center">
                        <User className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">
                          {lead.assigned_employee_name || 'Unknown'}
                        </span>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedLead(lead);
                          setShowAssignModal(true);
                        }}
                        className="text-sm text-amber-600 hover:text-amber-700 font-medium"
                      >
                        Assign
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(lead.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {!isEmployee ? (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewProgressUpdates(lead)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Progress Updates"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedLead(lead);
                            setShowAssignModal(true);
                          }}
                          className="text-amber-600 hover:text-amber-900"
                          title="Assign Lead"
                        >
                          <Send size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteLead(lead.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete Lead"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-400">View Only</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {sortedLeads.length === 0 && (
          <div className="text-center py-12">
            <Target className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No leads found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter !== 'all' || employeeFilter !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by creating a new lead.'}
            </p>
          </div>
        )}
      </div>

      {/* Create Lead Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Create New Lead</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleCreateLead} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={leadForm.company_name}
                    onChange={(e) => setLeadForm({...leadForm, company_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project Name
                  </label>
                  <input
                    type="text"
                    value={leadForm.project_name}
                    onChange={(e) => setLeadForm({...leadForm, project_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Client Email
                  </label>
                  <input
                    type="email"
                    value={leadForm.client_email}
                    onChange={(e) => setLeadForm({...leadForm, client_email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Client Phone
                  </label>
                  <input
                    type="tel"
                    value={leadForm.client_phone}
                    onChange={(e) => setLeadForm({...leadForm, client_phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={leadForm.location}
                    onChange={(e) => setLeadForm({...leadForm, location: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Industry
                  </label>
                  <input
                    type="text"
                    value={leadForm.industry}
                    onChange={(e) => setLeadForm({...leadForm, industry: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={leadForm.priority}
                    onChange={(e) => setLeadForm({...leadForm, priority: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estimated Value
                  </label>
                  <input
                    type="text"
                    value={leadForm.estimated_value}
                    onChange={(e) => setLeadForm({...leadForm, estimated_value: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Remarks
                </label>
                <textarea
                  value={leadForm.remarks}
                  onChange={(e) => setLeadForm({...leadForm, remarks: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
              
              {/* Assignment Section */}
              <div className="col-span-2 border-t pt-4">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Assignment Options</h4>
                
                <div className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    id="assign_to_employee"
                    checked={leadForm.assign_to_employee}
                    onChange={(e) => setLeadForm({...leadForm, assign_to_employee: e.target.checked})}
                    className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                  />
                  <label htmlFor="assign_to_employee" className="ml-2 text-sm font-medium text-gray-700">
                    Assign this lead to an employee immediately
                  </label>
                </div>
                
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start">
                    <Bell className="h-5 w-5 text-blue-600 mt-0.5 mr-2" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium">Manager Notification</p>
                      <p>When you assign a lead, the employee's manager will be automatically notified about the assignment and can track progress updates.</p>
                    </div>
                  </div>
                </div>
                
                {leadForm.assign_to_employee && (
                  <div className="space-y-4">
                    {/* Employee Selection */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Employee ID *
                        </label>
                        <input
                          type="number"
                          required={leadForm.assign_to_employee}
                          value={employeeSearchId}
                          onChange={(e) => setEmployeeSearchId(e.target.value)}
                          placeholder="Enter Employee ID"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        />
                        {searchedEmployee && (
                          <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-sm text-green-800">
                              Employee Found: {searchedEmployee.name}
                            </p>
                            <p className="text-xs text-green-600">
                              {searchedEmployee.position} • {searchedEmployee.department}
                            </p>
                            {searchedEmployee.manager && (
                              <p className="text-xs text-green-600 font-medium">
                                Manager: {searchedEmployee.manager}
                              </p>
                            )}
                          </div>
                        )}
                        {employeeSearchId && !searchedEmployee && (
                          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-800">
                              Employee not found
                            </p>
                          </div>
                        )}
                      </div>
                    
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Due Date
                        </label>
                        <input
                          type="date"
                          value={leadForm.due_date}
                          onChange={(e) => setLeadForm({...leadForm, due_date: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Assignment Notes
                        </label>
                        <textarea
                          value={leadForm.assignment_notes}
                          onChange={(e) => setLeadForm({...leadForm, assignment_notes: e.target.value})}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                          placeholder="Add specific instructions or notes for the employee..."
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                >
                  Create Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Company Management Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Company Management & Email Scheduling</h2>
              <button
                onClick={() => setShowEmailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            
            {/* Companies Section */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Companies</h3>
                <div className="flex items-center gap-3">
                  <select
                    value={industryFilter}
                    onChange={(e) => setIndustryFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Industries</option>
                    {[...new Set((companies || []).map(c => c.industry).filter(Boolean))].map(industry => (
                      <option key={industry} value={industry}>{industry}</option>
                    ))}
                  </select>
                  <select
                    value={emailTypeFilter}
                    onChange={(e) => setEmailTypeFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Companies</option>
                    <option value="intro">Need Intro Email (haven't received)</option>
                    <option value="first_followup">Need First Follow-Up (received intro only)</option>
                    <option value="second_followup">Need Second Follow-Up (received first only)</option>
                    <option value="third_followup">Need Third Follow-Up (received second only)</option>
                    <option value="final_followup">Need Final Follow-Up (received third only)</option>
                  </select>
                  {selectedCompanies.length > 0 && (
                    <button
                      onClick={() => setShowBulkScheduleModal(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Send size={16} />
                      Schedule Bulk Email ({selectedCompanies.length})
                    </button>
                  )}
                  <button
                    onClick={() => setShowAddCompanyModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus size={16} />
                    Add Company
                  </button>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <input
                            type="checkbox"
                            checked={selectedCompanies.length === getFilteredCompanies().length && getFilteredCompanies().length > 0}
                            onChange={handleSelectAllCompanies}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Company Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contact Person
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Industry
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email History
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {getFilteredCompanies().map(company => (
                        <tr key={company.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedCompanies.includes(company.id)}
                              onChange={() => handleSelectCompany(company.id)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {company.company_name}
                            </div>
                            {company.website && (
                              <div className="text-sm text-gray-500">
                                <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                                  {company.website}
                                </a>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{company.email}</div>
                            {company.phone && (
                              <div className="text-sm text-gray-500">{company.phone}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {company.contact_person || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {company.industry || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {company.email_type === 'intro' ? 'Email 1: Intro Email' :
                               company.email_type === 'first_followup' ? 'Email 2: First Follow-Up' :
                               company.email_type === 'second_followup' ? 'Email 3: Second Follow-Up' :
                               company.email_type === 'third_followup' ? 'Email 4: Third Follow-Up' :
                               company.email_type === 'final_followup' ? 'Email 5: Final Follow-Up' :
                               'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {company.sent_email_types ? (
                                <div className="flex flex-wrap gap-1">
                                  {company.sent_email_types.split(',').map((emailType, index) => {
                                    // Ensure emailType is a string, or default to 'Unknown' if it's an object
                                    const emailTypeStr = typeof emailType === 'object' && emailType !== null
                                                         ? 'Unknown' // Fallback for unexpected object types
                                                         : String(emailType); // Convert to string otherwise

                                    let displayValue;
                                    switch (emailTypeStr) {
                                      case 'intro': displayValue = '1'; break;
                                      case 'first_followup': displayValue = '2'; break;
                                      case 'second_followup': displayValue = '3'; break;
                                      case 'third_followup': displayValue = '4'; break;
                                      case 'final_followup': displayValue = '5'; break;
                                      default: displayValue = emailTypeStr; // Fallback to the string itself
                                    }

                                    return (
                                      <span key={index} className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                        {displayValue}
                                      </span>
                                    );
                                  })}
                                </div>
                              ) : (
                                <span className="text-gray-400 text-xs">No emails sent</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              company.status === 'active' ? 'bg-green-100 text-green-800' :
                              company.status === 'inactive' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {company.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setSelectedCompany(company);
                                  setScheduleForm({ 
                                    ...scheduleForm, 
                                    company_id: company.id,
                                    email_type: company.email_type || 'intro'
                                  });
                                  setShowScheduleEmailModal(true);
                                }}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                Schedule Email
                              </button>
                              <button
                                onClick={() => handleDeleteCompany(company.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            
            {/* Scheduled Emails Section */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Scheduled Emails</h3>
                {(scheduledEmails || []).filter(e => e.status === 'pending').length > 0 && (
                  <button
                    onClick={handleSendAllPendingEmails}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    <Send size={16} />
                    Send All Pending ({(scheduledEmails || []).filter(e => e.status === 'pending').length})
                  </button>
                )}
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Company
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Subject
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Scheduled Time
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {(scheduledEmails || []).map(email => (
                        <tr key={email.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {email.company_name}
                            </div>
                            <div className="text-sm text-gray-500">{email.email}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 max-w-xs truncate">
                              {email.subject}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {formatDateTime(email.scheduled_time)}
                            </div>
                            {email.sent_at && (
                              <div className="text-xs text-gray-500">
                                Sent: {formatDateTime(email.sent_at)}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              email.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              email.status === 'sent' ? 'bg-green-100 text-green-800' :
                              email.status === 'failed' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {email.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center gap-2">
                              {email.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleSendEmailNow(email.id)}
                                    className="text-green-600 hover:text-green-900"
                                  >
                                    Send Now
                                  </button>
                                  <button
                                    onClick={() => handleCancelEmail(email.id)}
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    Cancel
                                  </button>
                                </>
                              )}
                              {email.status === 'sent' && (
                                <span className="text-gray-500 text-xs">
                                  Sent ✓
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Company Modal */}
      {showAddCompanyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Add New Company</h2>
              <button
                onClick={() => setShowAddCompanyModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleCreateCompany} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={companyForm.company_name}
                    onChange={(e) => setCompanyForm({...companyForm, company_name: e.target.value})}
                    placeholder="Enter company name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={companyForm.email}
                    onChange={(e) => setCompanyForm({...companyForm, email: e.target.value})}
                    placeholder="company@example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    value={companyForm.contact_person}
                    onChange={(e) => setCompanyForm({...companyForm, contact_person: e.target.value})}
                    placeholder="John Doe"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={companyForm.phone}
                    onChange={(e) => setCompanyForm({...companyForm, phone: e.target.value})}
                    placeholder="+1 (555) 123-4567"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Industry
                  </label>
                  <input
                    type="text"
                    value={companyForm.industry}
                    onChange={(e) => setCompanyForm({...companyForm, industry: e.target.value})}
                    placeholder="Technology, Healthcare, etc."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Website
                  </label>
                  <input
                    type="url"
                    value={companyForm.website}
                    onChange={(e) => setCompanyForm({...companyForm, website: e.target.value})}
                    placeholder="https://www.company.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Type *
                  </label>
                  <select
                    value={companyForm.email_type}
                    onChange={(e) => setCompanyForm({...companyForm, email_type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="intro">Email 1: Intro Email</option>
                    <option value="first_followup">Email 2: First Follow-Up</option>
                    <option value="second_followup">Email 3: Second Follow-Up</option>
                    <option value="third_followup">Email 4: Third Follow-Up</option>
                    <option value="final_followup">Email 5: Final Follow-Up</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddCompanyModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Company
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Email Modal */}
      {showScheduleEmailModal && selectedCompany && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Schedule Email</h2>
              <button
                onClick={() => setShowScheduleEmailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-medium text-blue-900">Company Details</h3>
              <p className="text-sm text-blue-800">{selectedCompany.company_name}</p>
              <p className="text-sm text-blue-800">{selectedCompany.email}</p>
              {selectedCompany.contact_person && (
                <p className="text-sm text-blue-800">Contact: {selectedCompany.contact_person}</p>
              )}
              {selectedCompany.industry && (
                <p className="text-sm text-blue-800">Industry: {selectedCompany.industry}</p>
              )}
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Type *
              </label>
              <select
                value={scheduleForm.email_type}
                onChange={(e) => setScheduleForm({...scheduleForm, email_type: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="intro">Email 1: Intro Email</option>
                <option value="first_followup">Email 2: First Follow-Up</option>
                <option value="second_followup">Email 3: Second Follow-Up</option>
                <option value="third_followup">Email 4: Third Follow-Up</option>
                <option value="final_followup">Email 5: Final Follow-Up</option>
              </select>
            </div>
            
            <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Email Template Preview</h4>
              <div className="text-sm text-gray-600">
                <p className="mb-1"><strong>Subject:</strong> {
                  scheduleForm.email_type === 'intro' ? 'Strengthening your digital presence across the Middle East' :
                  scheduleForm.email_type === 'first_followup' ? 'Following up on your digital marketing initiatives' :
                  scheduleForm.email_type === 'second_followup' ? 'Achieving measurable ROI through digital marketing' :
                  scheduleForm.email_type === 'third_followup' ? 'Your reliable partner for digital growth in the Middle East' :
                  scheduleForm.email_type === 'final_followup' ? 'Staying connected for future digital initiatives' :
                  'Let\'s Connect — Explore How We Can Add Value to Your Business'
                }</p>
                <p className="text-xs text-gray-500">
                  Template will be personalized with company name and contact person
                </p>
              </div>
            </div>
            
            <form onSubmit={handleScheduleEmail} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Schedule Date & Time *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={scheduleForm.scheduled_time}
                  onChange={(e) => setScheduleForm({...scheduleForm, scheduled_time: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Email Preview</h4>
                <p className="text-sm text-gray-600 mb-1"><strong>Subject:</strong> {
                  scheduleForm.email_type === 'intro' ? 'Strengthening your digital presence across the Middle East' :
                  scheduleForm.email_type === 'first_followup' ? 'Following up on your digital marketing initiatives' :
                  scheduleForm.email_type === 'second_followup' ? 'Achieving measurable ROI through digital marketing' :
                  scheduleForm.email_type === 'third_followup' ? 'Your reliable partner for digital growth in the Middle East' :
                  scheduleForm.email_type === 'final_followup' ? 'Staying connected for future digital initiatives' :
                  'Let\'s Connect — Explore How We Can Add Value to Your Business'
                }</p>
                <p className="text-xs text-gray-500">
                  The email will be automatically generated with personalized content for {selectedCompany.company_name}.
                </p>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowScheduleEmailModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Send size={16} />
                  Schedule Email
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Schedule Email Modal */}
      {showBulkScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 pb-8 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Schedule Bulk Emails</h2>
              <button
                onClick={() => setShowBulkScheduleModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-medium text-green-900">Selected Companies</h3>
              <p className="text-sm text-green-800">
                {selectedCompanies.length} companies selected for bulk email scheduling
              </p>
              <div className="mt-2 text-xs text-green-700">
                {companies.filter(c => selectedCompanies.includes(c.id)).map(c => c.company_name).join(', ')}
              </div>
            </div>
            
            <form onSubmit={handleBulkScheduleEmails} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Schedule Date & Time *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={bulkScheduleForm.scheduled_time}
                  onChange={(e) => setBulkScheduleForm({...bulkScheduleForm, scheduled_time: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Companies per Batch *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={bulkScheduleForm.batch_size}
                  onChange={(e) => setBulkScheduleForm({...bulkScheduleForm, batch_size: parseInt(e.target.value) || 1})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., 10"
                />
                <p className="text-xs text-gray-500 mt-1">
                  How many companies should receive emails in each batch
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time Interval between Batches (minutes) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={bulkScheduleForm.batch_interval}
                  onChange={(e) => setBulkScheduleForm({...bulkScheduleForm, batch_interval: parseInt(e.target.value) || 1})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., 10"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Wait time between sending each batch of emails
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Type *
                </label>
                <select
                  required
                  value={bulkScheduleForm.email_type || 'intro'}
                  onChange={(e) => setBulkScheduleForm({...bulkScheduleForm, email_type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="intro">Intro Email</option>
                  <option value="first_followup">First Follow-Up</option>
                  <option value="second_followup">Second Follow-Up</option>
                  <option value="third_followup">Third Follow-Up</option>
                  <option value="final_followup">Final Follow-Up</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Select which type of email to send to all selected companies
                </p>
              </div>
              
              {/* Document Upload - Only for Intro Email */}
              {bulkScheduleForm.email_type === 'intro' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Attach Document (Optional)
                  </label>
                  <input
                    type="file"
                    accept="*/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      setBulkScheduleForm({...bulkScheduleForm, attachment: file});
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Attach any document to include with the intro email (PDF, DOC, XLS, PPT, images, etc.)
                  </p>
                </div>
              )}
              
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Email Template Preview</h4>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 leading-relaxed">
                    <strong className="font-semibold">Template:</strong> {bulkScheduleForm.email_type === 'intro' ? 'Strengthening your digital presence across the Middle East' :
                                            bulkScheduleForm.email_type === 'first_followup' ? 'Following up on your digital marketing initiatives' :
                                            bulkScheduleForm.email_type === 'second_followup' ? 'Achieving measurable ROI through digital marketing' :
                                            bulkScheduleForm.email_type === 'third_followup' ? 'Your reliable partner for digital growth in the Middle East' :
                                            bulkScheduleForm.email_type === 'final_followup' ? 'Staying connected for future digital initiatives' :
                                            'Dynamic templates based on each company\'s email type and industry'}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong className="font-semibold">Email Type:</strong> {bulkScheduleForm.email_type === 'intro' ? 'Intro Email' :
                                            bulkScheduleForm.email_type === 'first_followup' ? 'First Follow-Up' :
                                            bulkScheduleForm.email_type === 'second_followup' ? 'Second Follow-Up' :
                                            bulkScheduleForm.email_type === 'third_followup' ? 'Third Follow-Up' :
                                            bulkScheduleForm.email_type === 'final_followup' ? 'Final Follow-Up' :
                                            bulkScheduleForm.email_type}
                  </p>
                  <p className="text-xs text-gray-500 pt-2">
                    Each email will be personalized with company name, contact person, and industry-specific content
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-6 pb-2 sticky bottom-0 bg-white">
                <button
                  type="button"
                  onClick={() => setShowBulkScheduleModal(false)}
                  className="px-6 py-2.5 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 whitespace-nowrap font-medium"
                >
                  <Send size={16} />
                  <span>Schedule {selectedCompanies.length} Email{selectedCompanies.length !== 1 ? 's' : ''}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Lead Modal */}
      {showAssignModal && selectedLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Assign Lead</h2>
              <button
                onClick={() => setShowAssignModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Assigning lead for:</p>
              <p className="font-medium text-gray-900">{selectedLead.company_name}</p>
              <p className="text-sm text-gray-500">{selectedLead.project_name}</p>
            </div>
            
            <form onSubmit={handleAssignLead} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Employee ID *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter Employee ID (e.g., 50098)"
                  value={assignForm.employee_id}
                  onChange={(e) => setAssignForm({...assignForm, employee_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
                {assignForm.employee_id && (
                  <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                    {loadingEmployeeDetails ? (
                      <p className="text-sm text-blue-600">Loading employee details...</p>
                    ) : assignEmployeeDetails ? (
                      <div>
                        <p className="text-sm text-blue-800 font-medium">
                          Employee: {assignEmployeeDetails.name}
                        </p>
                        <p className="text-xs text-blue-600">
                          {assignEmployeeDetails.designation || 'No Designation'}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm text-blue-800">
                          Employee ID: {assignForm.employee_id}
                        </p>
                        <p className="text-xs text-red-600">
                          Employee not found
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={assignForm.due_date}
                  onChange={(e) => setAssignForm({...assignForm, due_date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={assignForm.notes}
                  onChange={(e) => setAssignForm({...assignForm, notes: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="Add any specific instructions or notes..."
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                >
                  Assign Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Progress Updates Modal */}
      {showProgressUpdates && selectedLeadForUpdates && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Progress Updates</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedLeadForUpdates.company_name} - {selectedLeadForUpdates.project_name}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowProgressUpdates(false);
                  setProgressUpdates([]);
                  setSelectedLeadForUpdates(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {progressUpdates.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="text-gray-500 mt-2">No progress updates yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Log Header */}
                  <div className="bg-gray-100 p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-600" />
                      <span className="text-sm font-semibold text-gray-700">Complete Activity Log ({progressUpdates.length} entries)</span>
                    </div>
                  </div>
                  
                  {/* Timeline of Updates */}
                  {progressUpdates.map((update, index) => (
                    <div key={update.id || index} className="relative">
                      {/* Timeline Connector */}
                      {index < progressUpdates.length - 1 && (
                        <div className="absolute left-7 top-12 bottom-0 w-0.5 bg-blue-300"></div>
                      )}
                      
                      <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-lg shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center justify-center w-6 h-6 bg-blue-600 rounded-full">
                              <span className="text-xs font-bold text-white">{index + 1}</span>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-blue-600" />
                                <span className="font-semibold text-gray-900">{update.employee_name}</span>
                              </div>
                            </div>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(update.created_at).toLocaleString('en-IN', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit'
                            })}
                          </span>
                        </div>
                        <div className="mb-2">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
                            {update.status}
                          </span>
                        </div>
                        {update.progress_notes && (
                          <div className="mt-2 p-2 bg-white rounded border border-blue-200">
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">
                              {update.progress_notes}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GenerateLeadsView;
