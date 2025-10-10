import React, { useState, useEffect } from 'react';
import { 
  Ticket, Plus, Edit, Trash2, Calendar, User, AlertCircle, 
  Clock, Filter, Search, X, Save, ArrowUp, ArrowDown, ArrowRight, MessageSquare
} from 'lucide-react';
import { apiCall } from '../utils/api';

const TicketsView = ({ showNotification }) => {
  const [tickets, setTickets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddTicket, setShowAddTicket] = useState(false);
  const [editingTicket, setEditingTicket] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [assignedToFilter, setAssignedToFilter] = useState('all');
  const [ticketUpdates, setTicketUpdates] = useState([]);
  const [showUpdates, setShowUpdates] = useState(false);

  const [ticketForm, setTicketForm] = useState({
    title: '',
    description: '',
    category: 'general',
    priority: 'medium',
    status: 'open',
    assigned_to_type: '',
    assigned_to_id: '',
    salary_code: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const handleSalaryCodeChange = (salaryCode) => {
    if (salaryCode && employees.length > 0) {
      const employee = employees.find(emp => emp.employeeId === salaryCode);
      if (employee) {
        setTicketForm(prev => ({
          ...prev,
          salary_code: salaryCode,
          assigned_to_type: 'employee',
          assigned_to_id: employee.id
        }));
      } else {
        setTicketForm(prev => ({
          ...prev,
          salary_code: salaryCode,
          assigned_to_type: '',
          assigned_to_id: ''
        }));
      }
    } else {
      setTicketForm(prev => ({
        ...prev,
        salary_code: salaryCode,
        assigned_to_type: '',
        assigned_to_id: ''
      }));
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [ticketsData, employeesData, vendorsData, updatesData] = await Promise.all([
        apiCall('/api/admin/tickets'),
        apiCall('/api/admin/employees'),
        apiCall('/api/admin/vendors'),
        apiCall('/api/admin/ticket-updates')
      ]);
      
      setTickets(ticketsData);
      setEmployees(employeesData);
      setVendors(vendorsData);
      setTicketUpdates(updatesData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      showNotification('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTicket = async () => {
    try {
      await apiCall('/api/admin/tickets', {
        method: 'POST',
        body: JSON.stringify(ticketForm)
      });
      
      showNotification('Ticket created successfully!', 'success');
      setShowAddTicket(false);
      resetTicketForm();
      loadData();
    } catch (error) {
      console.error('Error creating ticket:', error);
      showNotification('Failed to create ticket', 'error');
    }
  };

  const handleEditTicket = async () => {
    try {
      await apiCall(`/api/admin/tickets/${editingTicket.id}`, {
        method: 'PUT',
        body: JSON.stringify(ticketForm)
      });
      
      showNotification('Ticket updated successfully!', 'success');
      setEditingTicket(null);
      resetTicketForm();
      loadData();
    } catch (error) {
      console.error('Error updating ticket:', error);
      showNotification('Failed to update ticket', 'error');
    }
  };

  const handleDeleteTicket = async (ticketId) => {
    if (!window.confirm('Are you sure you want to delete this ticket?')) return;
    
    try {
      await apiCall(`/api/admin/tickets/${ticketId}`, {
        method: 'DELETE'
      });
      
      showNotification('Ticket deleted successfully!', 'success');
      loadData();
    } catch (error) {
      console.error('Error deleting ticket:', error);
      showNotification('Failed to delete ticket', 'error');
    }
  };

  const resetTicketForm = () => {
    setTicketForm({
      title: '',
      description: '',
      category: 'general',
      priority: 'medium',
      status: 'open',
      assigned_to_type: '',
      assigned_to_id: '',
      salary_code: ''
    });
  };

  const openEditTicket = (ticket) => {
    setEditingTicket(ticket);
    setTicketForm({
      title: ticket.title,
      description: ticket.description || '',
      category: ticket.category,
      priority: ticket.priority,
      status: ticket.status,
      assigned_to_type: ticket.assigned_to_type || '',
      assigned_to_id: ticket.assigned_to_id || '',
      salary_code: ticket.salary_code || ''
    });
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'Critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'High': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'Resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      case 'Closed': return 'bg-gray-100 text-gray-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      case 'open': return 'bg-yellow-100 text-yellow-800';
      case 'Open': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'technical': return 'bg-blue-100 text-blue-800';
      case 'billing': return 'bg-green-100 text-green-800';
      case 'support': return 'bg-purple-100 text-purple-800';
      case 'feature_request': return 'bg-orange-100 text-orange-800';
      case 'bug_report': return 'bg-red-100 text-red-800';
      case 'general': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredTickets = (tickets || []).filter(ticket => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (ticket.description && ticket.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
    const matchesCategory = categoryFilter === 'all' || ticket.category === categoryFilter;
    const matchesAssigned = assignedToFilter === 'all' || 
                          (assignedToFilter === 'assigned' && ticket.assigned_to_id) ||
                          (assignedToFilter === 'unassigned' && !ticket.assigned_to_id);
    
    return matchesSearch && matchesStatus && matchesPriority && matchesCategory && matchesAssigned;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Ticket Management</h2>
          <p className="text-gray-600 mt-1">Manage and track all support tickets and requests</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowUpdates(!showUpdates)}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            <Clock size={18} />
            Updates ({ticketUpdates.length})
          </button>
          <button
            onClick={() => setShowAddTicket(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Plus size={18} />
            Add Ticket
          </button>
        </div>
      </div>

      {/* Updates Section */}
      {showUpdates && (
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Ticket Updates</h3>
              <Clock className="h-5 w-5 text-gray-400" />
            </div>
          </div>
          <div className="p-6">
            {ticketUpdates.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No updates yet</p>
                <p className="text-gray-400 text-sm">Employee updates will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {ticketUpdates.map((update) => (
                  <div key={update.id} className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border-l-4 border-purple-400">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-lg font-semibold text-gray-900">{update.ticket_title}</h4>
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                            Update
                          </span>
                        </div>
                        <p className="text-gray-700 mb-3">{update.update_message}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span><strong>Employee:</strong> {update.employee_name}</span>
                          <span><strong>Status:</strong> {update.status || 'No status change'}</span>
                          <span><strong>Updated:</strong> {new Date(update.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Tickets</p>
              <p className="text-2xl font-bold text-gray-900">{tickets?.length || 0}</p>
            </div>
            <Ticket className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Open</p>
              <p className="text-2xl font-bold text-gray-900">{(tickets || []).filter(t => t.status === 'open' || t.status === 'Open').length}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-gray-900">{(tickets || []).filter(t => t.status === 'in_progress' || t.status === 'In Progress').length}</p>
            </div>
            <ArrowRight className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Resolved</p>
              <p className="text-2xl font-bold text-gray-900">{(tickets || []).filter(t => t.status === 'resolved' || t.status === 'Resolved').length}</p>
            </div>
            <Ticket className="h-8 w-8 text-green-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search tickets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Priority</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              <option value="general">General</option>
              <option value="technical">Technical</option>
              <option value="billing">Billing</option>
              <option value="support">Support</option>
              <option value="feature_request">Feature Request</option>
              <option value="bug_report">Bug Report</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Assignment</label>
            <select
              value={assignedToFilter}
              onChange={(e) => setAssignedToFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Tickets</option>
              <option value="assigned">Assigned</option>
              <option value="unassigned">Unassigned</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ticket</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{ticket.title}</div>
                      {ticket.description && (
                        <div className="text-sm text-gray-500 truncate max-w-xs">{ticket.description}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(ticket.category || 'general')}`}>
                      {ticket.category ? ticket.category.replace('_', ' ') : 'General'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(ticket.priority || 'medium')}`}>
                      {ticket.priority || 'Medium'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(ticket.status)}`}>
                      {ticket.status ? ticket.status.replace('_', ' ') : 'Open'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {ticket.assigned_to_name || 'Unassigned'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(ticket.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditTicket(ticket)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteTicket(ticket.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Ticket Modal */}
      {showAddTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b flex-shrink-0">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">Add New Ticket</h3>
                <button
                  onClick={() => {
                    setShowAddTicket(false);
                    resetTicketForm();
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto flex-1 modal-scrollbar">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ticket Title *</label>
                  <input
                    type="text"
                    value={ticketForm.title}
                    onChange={(e) => setTicketForm({...ticketForm, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter ticket title"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={ticketForm.description}
                    onChange={(e) => setTicketForm({...ticketForm, description: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter ticket description"
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select
                      value={ticketForm.category}
                      onChange={(e) => setTicketForm({...ticketForm, category: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="general">General</option>
                      <option value="technical">Technical</option>
                      <option value="billing">Billing</option>
                      <option value="support">Support</option>
                      <option value="feature_request">Feature Request</option>
                      <option value="bug_report">Bug Report</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                    <select
                      value={ticketForm.priority}
                      onChange={(e) => setTicketForm({...ticketForm, priority: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      value={ticketForm.status}
                      onChange={(e) => setTicketForm({...ticketForm, status: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Assign To</label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 text-xs text-gray-500">Select Type</label>
                      <select
                        value={ticketForm.assigned_to_type}
                        onChange={(e) => setTicketForm({...ticketForm, assigned_to_type: e.target.value, assigned_to_id: ''})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select Type</option>
                        <option value="employee">Employee</option>
                        <option value="vendor">Vendor</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Salary Code</label>
                      <input
                        type="text"
                        value={ticketForm.salary_code}
                        onChange={(e) => handleSalaryCodeChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter employee salary code"
                      />
                      {ticketForm.assigned_to_id && employees.find(emp => emp.id === ticketForm.assigned_to_id) && (
                        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-sm text-green-800">
                            <strong>Employee Found:</strong> {employees.find(emp => emp.id === ticketForm.assigned_to_id)?.name}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t flex-shrink-0">
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowAddTicket(false);
                    resetTicketForm();
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddTicket}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Create Ticket
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Ticket Modal */}
      {editingTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b flex-shrink-0">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">Edit Ticket</h3>
                <button
                  onClick={() => {
                    setEditingTicket(null);
                    resetTicketForm();
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto flex-1 modal-scrollbar">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ticket Title *</label>
                  <input
                    type="text"
                    value={ticketForm.title}
                    onChange={(e) => setTicketForm({...ticketForm, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter ticket title"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={ticketForm.description}
                    onChange={(e) => setTicketForm({...ticketForm, description: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter ticket description"
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select
                      value={ticketForm.category}
                      onChange={(e) => setTicketForm({...ticketForm, category: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="general">General</option>
                      <option value="technical">Technical</option>
                      <option value="billing">Billing</option>
                      <option value="support">Support</option>
                      <option value="feature_request">Feature Request</option>
                      <option value="bug_report">Bug Report</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                    <select
                      value={ticketForm.priority}
                      onChange={(e) => setTicketForm({...ticketForm, priority: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      value={ticketForm.status}
                      onChange={(e) => setTicketForm({...ticketForm, status: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Assign To</label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 text-xs text-gray-500">Select Type</label>
                      <select
                        value={ticketForm.assigned_to_type}
                        onChange={(e) => setTicketForm({...ticketForm, assigned_to_type: e.target.value, assigned_to_id: ''})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select Type</option>
                        <option value="employee">Employee</option>
                        <option value="vendor">Vendor</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Salary Code</label>
                      <input
                        type="text"
                        value={ticketForm.salary_code}
                        onChange={(e) => handleSalaryCodeChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter employee salary code"
                      />
                      {ticketForm.assigned_to_id && employees.find(emp => emp.id === ticketForm.assigned_to_id) && (
                        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-sm text-green-800">
                            <strong>Employee Found:</strong> {employees.find(emp => emp.id === ticketForm.assigned_to_id)?.name}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t flex-shrink-0">
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setEditingTicket(null);
                    resetTicketForm();
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditTicket}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Update Ticket
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketsView;
