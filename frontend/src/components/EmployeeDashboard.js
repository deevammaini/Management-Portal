import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, Briefcase, Ticket, Bell, Calendar, Clock, 
  AlertCircle, ArrowRight, User, Settings, LogOut, Home,
  BarChart3, TrendingUp, FileText, Users, Plus, Filter,
  Eye, Edit, Trash2, Download, Upload, Search, Star,
  CheckCircle2, XCircle, Clock3, AlertTriangle, Check, X, Menu
} from 'lucide-react';
import { apiCall } from '../utils/api';

const EmployeeDashboard = ({ user, onLogout }) => {
  const [notifications, setNotifications] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [showNotificationDetails, setShowNotificationDetails] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [attendanceStatus, setAttendanceStatus] = useState({
    clocked_in: false,
    clocked_out: false,
    status: 'Absent',
    clock_in_time: null,
    clock_out_time: null,
    total_hours: 0,
    late_minutes: 0
  });
  const [notification, setNotification] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showCreateTicketModal, setShowCreateTicketModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [updateForm, setUpdateForm] = useState({
    status: '',
    comments: ''
  });
  const [createTicketForm, setCreateTicketForm] = useState({
    title: '',
    description: '',
    category: 'general',
    priority: 'medium'
  });
  
  // Enhanced state for comprehensive dashboard
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    overdueTasks: 0,
    totalProjects: 0,
    activeProjects: 0,
    totalTickets: 0,
    openTickets: 0,
    unreadNotifications: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profilePicture, setProfilePicture] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileForm, setProfileForm] = useState({
    gender: '',
    dateOfBirth: '',
    phone: '',
    address: '',
    emergencyContact: '',
    skills: '',
    bio: ''
  });

  // Holiday data
  const holidays = [
    { date: '2025-10-02', day: 'Thursday', name: 'Dussehra / Vijaya Dashami & Gandhi Jayanti' },
    { date: '2025-10-07', day: 'Tuesday', name: 'Maharishi Valmiki Jayanti' },
    { date: '2025-10-20', day: 'Monday', name: 'Diwali' },
    { date: '2025-10-22', day: 'Wednesday', name: 'Govardhan Puja' },
    { date: '2025-11-05', day: 'Wednesday', name: 'Guru Nanak Jayanti' },
    { date: '2025-12-25', day: 'Thursday', name: 'Christmas Day' },
    { date: '2025-12-27', day: 'Saturday', name: 'Guru Gobind Singh Jayanti' }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('Loading data for employee ID:', user.id);
      
      const [notificationsData, announcementsData, tasksData, projectsData, ticketsData] = await Promise.all([
        apiCall(`/api/employee/notifications?employee_id=${user.id}`),
        apiCall(`/api/employee/announcements?employee_id=${user.id}`),
        apiCall(`/api/admin/tasks`).then(tasks => tasks.filter(task => task.assigned_to_id == user.id)),
        apiCall(`/api/admin/projects`).then(projects => projects.filter(project => project.assigned_to_id == user.id)),
        apiCall(`/api/admin/tickets`).then(tickets => tickets.filter(ticket => ticket.assigned_to_id == user.id))
      ]);
      
      console.log('Raw tickets data:', ticketsData);
      console.log('Filtered tickets for employee:', ticketsData.filter(ticket => ticket.assigned_to_id == user.id));
      
      setNotifications(notificationsData);
      setAnnouncements(announcementsData);
      setTasks(tasksData);
      setProjects(projectsData);
      setTickets(ticketsData);
      
      // Calculate statistics
      const calculatedStats = {
        totalTasks: tasksData.length,
        completedTasks: tasksData.filter(task => task.status === 'completed').length,
        pendingTasks: tasksData.filter(task => task.status === 'pending' || task.status === 'in_progress').length,
        overdueTasks: tasksData.filter(task => {
          if (!task.due_date) return false;
          return new Date(task.due_date) < new Date() && task.status !== 'completed';
        }).length,
        totalProjects: projectsData.length,
        activeProjects: projectsData.filter(project => project.status === 'active' || project.status === 'in_progress').length,
        totalTickets: ticketsData.length,
        openTickets: ticketsData.filter(ticket => ticket.status === 'open' || ticket.status === 'in_progress').length,
        unreadNotifications: notificationsData.filter(notification => !notification.read).length
      };
      setStats(calculatedStats);
      
      // Generate recent activity
      const allActivity = [
        ...tasksData.map(task => ({
          type: 'task',
          id: task.id,
          title: task.title,
          status: task.status,
          updated_at: task.updated_at,
          priority: task.priority
        })),
        ...projectsData.map(project => ({
          type: 'project',
          id: project.id,
          title: project.title,
          status: project.status,
          updated_at: project.updated_at,
          priority: project.priority
        })),
        ...ticketsData.map(ticket => ({
          type: 'ticket',
          id: ticket.id,
          title: ticket.title,
          status: ticket.status,
          updated_at: ticket.updated_at,
          priority: ticket.priority
        }))
      ].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)).slice(0, 10);
      
      setRecentActivity(allActivity);
      
      // Generate upcoming deadlines
      const upcoming = [
        ...tasksData.filter(task => task.due_date && new Date(task.due_date) > new Date()).map(task => ({
          type: 'task',
          id: task.id,
          title: task.title,
          due_date: task.due_date,
          priority: task.priority
        })),
        ...projectsData.filter(project => project.end_date && new Date(project.end_date) > new Date()).map(project => ({
          type: 'project',
          id: project.id,
          title: project.title,
          due_date: project.end_date,
          priority: project.priority
        }))
      ].sort((a, b) => new Date(a.due_date) - new Date(b.due_date)).slice(0, 5);
      
      setUpcomingDeadlines(upcoming);
      
      // Load attendance status
      loadAttendanceStatus();
      
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notification) => {
    try {
      // Mark notification as read
      await apiCall('/api/notifications/mark-as-read', {
        method: 'POST',
        body: JSON.stringify({
          user_id: user.id,
          notification_type: notification.type,
          notification_id: notification.id.split('_')[1] // Extract ID from "type_id" format
        })
      });

      // Get notification details
      const details = await apiCall(`/api/notifications/${notification.type}/${notification.id.split('_')[1]}`);
      
      setSelectedNotification(details);
      setShowNotificationDetails(true);

      // Update local notifications state to mark as read
      setNotifications(prev => 
        prev.map(n => 
          n.id === notification.id ? { ...n, read: true, read_at: new Date().toISOString() } : n
        )
      );
    } catch (error) {
      console.error('Error handling notification click:', error);
    }
  };

  const closeNotificationDetails = () => {
    setShowNotificationDetails(false);
    setSelectedNotification(null);
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const loadAttendanceStatus = async () => {
    try {
      const response = await apiCall(`/api/employee/attendance/status?employee_id=${user.id}`);
      if (response.success) {
        setAttendanceStatus(response.attendance);
      }
    } catch (error) {
      console.error('Error loading attendance status:', error);
    }
  };

  const handleClockIn = async () => {
    try {
      const response = await apiCall('/api/employee/attendance/clock-in', {
        method: 'POST',
        body: JSON.stringify({ employee_id: user.id })
      });
      
      if (response.success) {
        showNotification(response.message, 'success');
        await loadAttendanceStatus(); // Reload status
      }
    } catch (error) {
      console.error('Error clocking in:', error);
      showNotification('Failed to clock in. Please try again.', 'error');
    }
  };

  const handleClockOut = async () => {
    try {
      const response = await apiCall('/api/employee/attendance/clock-out', {
        method: 'POST',
        body: JSON.stringify({ employee_id: user.id })
      });
      
      if (response.success) {
        showNotification(response.message, 'success');
        await loadAttendanceStatus(); // Reload status
      }
    } catch (error) {
      console.error('Error clocking out:', error);
      showNotification('Failed to clock out. Please try again.', 'error');
    }
  };

  const handleUpdateItem = async () => {
    try {
      const endpoint = selectedItem.type === 'task' ? 
        `/api/employee/tasks/${selectedItem.id}/update` :
        selectedItem.type === 'project' ?
        `/api/employee/projects/${selectedItem.id}/update` :
        `/api/employee/tickets/${selectedItem.id}/update`;
      
      await apiCall(endpoint, {
        method: 'PUT',
        body: JSON.stringify({
          employee_id: user.id,
          status: updateForm.status,
          comments: updateForm.comments
        })
      });
      
      setShowUpdateModal(false);
      setSelectedItem(null);
      setUpdateForm({ status: '', comments: '' });
      loadData(); // Reload data to reflect changes
    } catch (error) {
      console.error('Error updating item:', error);
    }
  };

  const openUpdateModal = (item) => {
    setSelectedItem(item);
    setUpdateForm({
      status: item.status,
      comments: ''
    });
    setShowUpdateModal(true);
  };

  const handleCreateTicket = async () => {
    try {
      console.log('Creating ticket with data:', {
        employee_id: user.id,
        title: createTicketForm.title,
        description: createTicketForm.description,
        category: createTicketForm.category,
        priority: createTicketForm.priority,
        status: 'open'
      });
      
      const response = await apiCall('/api/employee/create-ticket', {
        method: 'POST',
        body: JSON.stringify({
          employee_id: user.id,
          title: createTicketForm.title,
          description: createTicketForm.description,
          category: createTicketForm.category,
          priority: createTicketForm.priority,
          status: 'open'
        })
      });
      
      console.log('Ticket creation response:', response);
      
      setShowCreateTicketModal(false);
      setCreateTicketForm({
        title: '',
        description: '',
        category: 'general',
        priority: 'medium'
      });
      loadData(); // Reload data to show the new ticket
    } catch (error) {
      console.error('Error creating ticket:', error);
      alert('Failed to create ticket. Please try again.');
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'open': return 'bg-yellow-100 text-yellow-800';
      case 'planning': return 'bg-purple-100 text-purple-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusOptions = (type) => {
    switch (type) {
      case 'task':
        return [
          { value: 'pending', label: 'Pending' },
          { value: 'in_progress', label: 'In Progress' },
          { value: 'completed', label: 'Completed' },
          { value: 'cancelled', label: 'Cancelled' }
        ];
      case 'project':
        return [
          { value: 'planning', label: 'Planning' },
          { value: 'in_progress', label: 'In Progress' },
          { value: 'on_hold', label: 'On Hold' },
          { value: 'completed', label: 'Completed' },
          { value: 'cancelled', label: 'Cancelled' }
        ];
      case 'ticket':
        return [
          { value: 'open', label: 'Open' },
          { value: 'in_progress', label: 'In Progress' },
          { value: 'resolved', label: 'Resolved' },
          { value: 'closed', label: 'Closed' }
        ];
      default:
        return [];
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 ${
          notification.type === 'success' 
            ? 'bg-green-500 text-white' 
            : 'bg-red-500 text-white'
        }`}>
          <div className="flex items-center gap-2">
            <span>{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="ml-2 text-white hover:text-gray-200"
            >
              ✕
            </button>
              </div>
              </div>
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg flex flex-col transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}>
        {/* Mobile Close Button */}
        <div className="lg:hidden flex justify-end p-4">
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <X size={20} />
              </button>
              </div>
            
        {/* Logo */}
        <div className="flex items-center gap-3 p-6 border-b">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center">
            <span className="text-white text-lg font-bold">Y</span>
            </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">YellowStone XPs</h1>
            <p className="text-xs text-gray-500">Employee Portal</p>
          </div>
        </div>

      {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: Home },
              { id: 'announcements', label: 'Announcements', icon: Bell },
              { id: 'attendance', label: 'Attendance', icon: Clock },
              { id: 'tasks', label: 'Tasks', icon: CheckSquare },
              { id: 'projects', label: 'Projects', icon: Briefcase },
              { id: 'tickets', label: 'Tickets', icon: Ticket },
              { id: 'profile', label: 'Profile', icon: User }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSidebarOpen(false); // Close sidebar on mobile after selection
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-amber-50 to-orange-50 text-amber-600 border-r-2 border-amber-500'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <tab.icon size={20} />
                {tab.label}
              </button>
            ))}
        </div>
      </nav>

        {/* User Info */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              {profilePicture ? (
                <img src={profilePicture} alt="Profile" className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <User className="h-5 w-5 text-blue-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
              <p className="text-xs text-gray-500 truncate">{user.designation}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Bell className="h-4 w-4 text-gray-600" />
              {stats.unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {stats.unreadNotifications}
                </span>
              )}
            </div>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Mobile Menu Button */}
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <Menu size={20} />
                </button>
                
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 capitalize">
                    {activeTab === 'dashboard' && 'Dashboard'}
                    {activeTab === 'announcements' && 'Announcements'}
                    {activeTab === 'tasks' && 'My Tasks'}
                    {activeTab === 'projects' && 'My Projects'}
                    {activeTab === 'tickets' && 'My Tickets'}
                    {activeTab === 'profile' && 'Profile'}
                  </h2>
                  <p className="text-gray-600">Welcome back, {user.name}!</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="relative">
                  <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <Bell size={20} />
                    {notifications.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {notifications.length}
                      </span>
                    )}
                  </button>
                  
                  {showNotifications && (
                    <div className="absolute right-0 top-12 w-96 bg-white rounded-xl shadow-lg border z-50">
                      <div className="p-4 border-b">
                        <div className="flex justify-between items-center">
                          <h3 className="font-semibold text-gray-900">Notifications</h3>
                          <span className="text-xs text-gray-500">{notifications.length} items</span>
                        </div>
                      </div>
                      <div className="max-h-[500px] overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-4 text-center text-gray-500">
                            No notifications
                          </div>
                        ) : (
                          notifications.map((notif, index) => (
                            <div 
                              key={index} 
                              className={`p-4 border-b hover:bg-gray-50 cursor-pointer transition-colors ${
                                notif.read ? 'opacity-75' : ''
                              }`}
                              onClick={() => handleNotificationClick(notif)}
                            >
                              <div className="flex items-start gap-3">
                                <div className={`w-3 h-3 rounded-full mt-1 ${
                                  notif.type === 'announcement' ? 'bg-amber-500' : 
                                  notif.type === 'task' ? 'bg-blue-500' :
                                  notif.type === 'project' ? 'bg-green-500' :
                                  notif.type === 'ticket' ? 'bg-purple-500' : 'bg-gray-500'
                                } ${notif.read ? 'opacity-50' : ''}`}></div>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm font-medium truncate ${
                                    notif.read ? 'text-gray-600' : 'text-gray-900'
                                  }`}>{notif.title}</p>
                                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">{notif.message || notif.description}</p>
                                  <p className="text-xs text-gray-400 mt-2">{new Date(notif.created_at).toLocaleString()}</p>
                                  {notif.read && (
                                    <p className="text-xs text-green-600 mt-1">✓ Read</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      {notifications.length > 0 && (
                        <div className="p-3 border-t">
                          <button 
                            onClick={() => {
                              setNotifications([]);
                              setShowNotifications(false);
                            }}
                            className="w-full text-sm text-blue-600 hover:text-blue-800"
                          >
                            Mark all as read
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

      {/* Content */}
        <main className="flex-1 p-6 overflow-auto">
          {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
              {/* Enhanced Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Tasks Card */}
                <div className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveTab('tasks')}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">My Tasks</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalTasks}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-green-600">{stats.completedTasks} completed</span>
                        <span className="text-xs text-orange-600">{stats.pendingTasks} pending</span>
                        {stats.overdueTasks > 0 && (
                          <span className="text-xs text-red-600">{stats.overdueTasks} overdue</span>
                        )}
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                      <CheckSquare className="h-6 w-6 text-white" />
                    </div>
                  </div>
            </div>

                {/* Projects Card */}
                <div className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveTab('projects')}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">My Projects</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalProjects}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-blue-600">{stats.activeProjects} active</span>
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                      <Briefcase className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </div>
                
                {/* Tickets Card */}
                <div className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveTab('tickets')}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">My Tickets</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalTickets}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-yellow-600">{stats.openTickets} open</span>
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <Ticket className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </div>
                
                {/* Announcements Card */}
                <div className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveTab('announcements')}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Announcements</p>
                      <p className="text-2xl font-bold text-gray-900">{announcements.length}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-amber-600">Latest updates</span>
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center">
                      <Bell className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Activity */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border">
                  <div className="p-6 border-b">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Recent Activity</h3>
                      <TrendingUp className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                  <div className="p-6">
                    {recentActivity.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No recent activity</p>
                    ) : (
                      <div className="space-y-4">
                        {recentActivity.map((activity) => (
                          <div key={`${activity.type}-${activity.id}`} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              {activity.type === 'task' && <CheckSquare className="h-5 w-5 text-blue-500" />}
                              {activity.type === 'project' && <Briefcase className="h-5 w-5 text-green-500" />}
                              {activity.type === 'ticket' && <Ticket className="h-5 w-5 text-purple-500" />}
                              <div>
                                <p className="font-medium">{activity.title}</p>
                                <div className="flex items-center gap-2">
                                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(activity.status)}`}>
                                    {activity.status}
                                  </span>
                                  <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(activity.priority)}`}>
                                    {activity.priority}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <span className="text-xs text-gray-500">
                              {new Date(activity.updated_at).toLocaleDateString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Upcoming Deadlines */}
                <div className="bg-white rounded-xl shadow-sm border">
                  <div className="p-6 border-b">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Upcoming Deadlines</h3>
                      <Calendar className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                  <div className="p-6">
                    {upcomingDeadlines.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No upcoming deadlines</p>
                    ) : (
                      <div className="space-y-4">
                        {upcomingDeadlines.map((deadline) => (
                          <div key={`${deadline.type}-${deadline.id}`} className="p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              {deadline.type === 'task' && <CheckSquare className="h-5 w-5 text-blue-500" />}
                              {deadline.type === 'project' && <Briefcase className="h-5 w-5 text-green-500" />}
                              <div className="flex-1">
                                <p className="font-medium text-sm">{deadline.title}</p>
                                <p className="text-xs text-gray-600">
                                  Due: {new Date(deadline.due_date).toLocaleDateString()}
                                </p>
                              </div>
                              <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(deadline.priority)}`}>
                                {deadline.priority}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Upcoming Holidays */}
                <div className="bg-white rounded-xl shadow-sm border">
                  <div className="p-6 border-b">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Upcoming Holidays</h3>
                      <Calendar className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                  <div className="p-6">
              <div className="space-y-3">
                      {holidays
                        .filter(holiday => new Date(holiday.date) >= new Date())
                        .slice(0, 4)
                        .map((holiday) => (
                          <div key={holiday.date} className="p-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border-l-4 border-orange-400">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-sm text-gray-900">{holiday.name}</p>
                                <p className="text-xs text-gray-600">{holiday.day}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-semibold text-orange-600">
                                  {new Date(holiday.date).toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric' 
                                  })}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                    {holidays.filter(holiday => new Date(holiday.date) >= new Date()).length === 0 && (
                      <p className="text-gray-500 text-center py-8">No upcoming holidays</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Recent Notifications */}
              <div className="bg-white rounded-xl shadow-sm border">
                <div className="p-6 border-b">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Recent Notifications</h3>
                    <Bell className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
                <div className="p-6">
                  {notifications.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No notifications</p>
                  ) : (
                    <div className="space-y-4">
                      {notifications.slice(0, 5).map((notification) => (
                        <div key={notification.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                            <Bell className="h-5 w-5 text-blue-500" />
                      <div>
                              <p className="font-medium">{notification.title}</p>
                              <p className="text-sm text-gray-600">{notification.message}</p>
                      </div>
                    </div>
                          <span className="text-xs text-gray-500">
                            {new Date(notification.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
                    </div>
                )}
              </div>
            </div>
          </div>
        )}

          {/* Announcements Tab */}
          {activeTab === 'announcements' && (
          <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border">
                <div className="p-6 border-b">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Company Announcements</h3>
                    <Bell className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
                <div className="p-6">
                  {announcements.length === 0 ? (
                    <div className="text-center py-12">
                      <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg">No announcements yet</p>
                      <p className="text-gray-400 text-sm">Check back later for company updates</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {announcements.map((announcement) => (
                        <div key={announcement.id} className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border-l-4 border-amber-400">
                          <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                                <h4 className="text-lg font-semibold text-gray-900">{announcement.title}</h4>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                  announcement.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                                  announcement.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                  announcement.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-green-100 text-green-800'
                                }`}>
                                  {announcement.priority}
                        </span>
                      </div>
                              <p className="text-gray-700 mb-3">{announcement.message}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span>Posted: {new Date(announcement.created_at).toLocaleDateString()}</span>
                                {announcement.expires_at && (
                                  <span>Expires: {new Date(announcement.expires_at).toLocaleDateString()}</span>
                                )}
                      </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tasks Tab */}
        {activeTab === 'tasks' && (
            <div className="bg-white rounded-xl shadow-sm border">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">My Tasks</h3>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search tasks..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="overdue">Overdue</option>
                    </select>
                  </div>
                </div>
                </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Task</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {tasks
                      .filter(task => {
                        const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()));
                        const matchesStatus = filterStatus === 'all' || 
                                            (filterStatus === 'overdue' ? 
                                              (task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed') :
                                              task.status === filterStatus);
                        return matchesSearch && matchesStatus;
                      })
                      .map((task) => (
                      <tr key={task.id}>
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium">{task.title}</div>
                            {task.description && (
                              <div className="text-sm text-gray-500">{task.description}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(task.status)}`}>
                            {task.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {task.due_date ? new Date(task.due_date).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => openUpdateModal({...task, type: 'task'})}
                            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                          >
                            Update
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            </div>
                </div>
              )}

          {/* Projects Tab */}
          {activeTab === 'projects' && (
            <div className="bg-white rounded-xl shadow-sm border">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold">My Projects</h3>
            </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timeline</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {projects.map((project) => (
                      <tr key={project.id}>
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium">{project.name}</div>
                            {project.description && (
                              <div className="text-sm text-gray-500">{project.description}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(project.priority)}`}>
                            {project.priority}
                        </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(project.status)}`}>
                            {project.status.replace('_', ' ')}
                        </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div>
                            {project.start_date && (
                              <div>Start: {new Date(project.start_date).toLocaleDateString()}</div>
                            )}
                            {project.end_date && (
                              <div>End: {new Date(project.end_date).toLocaleDateString()}</div>
                            )}
                      </div>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => openUpdateModal({...project, type: 'project'})}
                            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                          >
                            Update
                    </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                  </div>
          </div>
        )}

          {/* Tickets Tab */}
          {activeTab === 'tickets' && (
            <div className="bg-white rounded-xl shadow-sm border">
              <div className="p-6 border-b flex justify-between items-center">
                <h3 className="text-lg font-semibold">My Tickets</h3>
                <button
                  onClick={() => setShowCreateTicketModal(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
                >
                  <Ticket size={18} />
                  Create Ticket
                </button>
            </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ticket</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {tickets.map((ticket) => (
                      <tr key={ticket.id}>
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium">{ticket.title}</div>
                            {ticket.description && (
                              <div className="text-sm text-gray-500">{ticket.description}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {ticket.category.replace('_', ' ')}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(ticket.priority)}`}>
                            {ticket.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(ticket.status)}`}>
                            {ticket.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => openUpdateModal({...ticket, type: 'ticket'})}
                            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                          >
                            Update
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            </div>
          </div>
        )}

          {/* Attendance Tab */}
        {activeTab === 'attendance' && (
          <div className="space-y-6">
            {/* Attendance Header */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Attendance Info</h2>
                  <p className="text-gray-600">Track your daily attendance and working hours</p>
                </div>
                      <div className="flex items-center gap-2">
                  <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                    <Calendar className="h-5 w-5" />
                  </button>
                  <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                    <Bell className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Clock In/Out Section */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-12 w-12 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Today's Attendance</h3>
                <p className="text-gray-600 mb-6">Working Hours: 9:30 AM - 6:30 PM</p>
                
                <div className="flex justify-center gap-4">
                  <button
                    onClick={handleClockIn}
                    disabled={attendanceStatus.clocked_in}
                    className={`px-8 py-3 rounded-lg font-semibold transition-colors ${
                      attendanceStatus.clocked_in
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-green-500 text-white hover:bg-green-600'
                    }`}
                  >
                    {attendanceStatus.clocked_in ? 'Already Clocked In' : 'Clock In'}
                  </button>
                  <button
                    onClick={handleClockOut}
                    disabled={!attendanceStatus.clocked_in || attendanceStatus.clocked_out}
                    className={`px-8 py-3 rounded-lg font-semibold transition-colors ${
                      !attendanceStatus.clocked_in || attendanceStatus.clocked_out
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-red-500 text-white hover:bg-red-600'
                    }`}
                  >
                    {attendanceStatus.clocked_out ? 'Already Clocked Out' : 'Clock Out'}
                  </button>
                </div>

                {/* Current Status */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Clock In:</span>
                      <span className="ml-2 font-medium">
                        {attendanceStatus.clock_in_time || 'Not clocked in'}
                        </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Clock Out:</span>
                      <span className="ml-2 font-medium">
                        {attendanceStatus.clock_out_time || 'Not clocked out'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Status:</span>
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${
                        attendanceStatus.status === 'Present' ? 'bg-green-100 text-green-800' :
                        attendanceStatus.status === 'Late' ? 'bg-yellow-100 text-yellow-800' :
                        attendanceStatus.status === 'Half Day' ? 'bg-orange-100 text-orange-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {attendanceStatus.status}
                        </span>
                      </div>
                    <div>
                      <span className="text-gray-600">Total Hours:</span>
                      <span className="ml-2 font-medium">
                        {attendanceStatus.total_hours}h
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Attendance Calendar */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">October 2025</h3>
                <div className="flex items-center gap-2">
                  <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                    <ArrowRight className="h-4 w-4 rotate-180" />
                  </button>
                  <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                    <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
              </div>
              
              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-2 mb-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                    {day}
                </div>
              ))}
                </div>
              
              <div className="grid grid-cols-7 gap-2">
                {/* Calendar dates would go here */}
                {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                  <div key={day} className="aspect-square flex items-center justify-center text-sm border rounded-lg hover:bg-gray-50 cursor-pointer">
                    {day}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

          {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
              {/* Profile Overview */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                      {profilePicture ? (
                        <img src={profilePicture} alt="Profile" className="w-20 h-20 rounded-full object-cover" />
                      ) : (
                        <User className="h-10 w-10 text-blue-600" />
                      )}
                    </div>
                    <button
                      onClick={() => setShowProfileModal(true)}
                      className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors"
                    >
                      <Edit size={12} />
                    </button>
                </div>
                <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
                    <p className="text-gray-600">{user.designation}</p>
                    <p className="text-sm text-gray-500">{user.department} • Employee ID: {user.employee_id}</p>
                    <p className="text-sm text-gray-500">Manager: {user.manager}</p>
                  </div>
                  <div className="text-right space-y-2">
                    <button
                      onClick={() => setShowSettings(true)}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
                    >
                      <Settings size={18} />
                      Settings
                    </button>
                    <button
                      onClick={() => setShowProfileModal(true)}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
                    >
                      <Edit size={18} />
                      Edit Profile
                    </button>
                  </div>
                </div>
              </div>

              {/* Profile Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Information */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium">{user.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Employee ID:</span>
                      <span className="font-medium">{user.employee_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Designation:</span>
                      <span className="font-medium">{user.designation}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Department:</span>
                      <span className="font-medium">{user.department}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Manager:</span>
                      <span className="font-medium">{user.manager}</span>
                    </div>
                    {profileForm.gender && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Gender:</span>
                        <span className="font-medium">{profileForm.gender}</span>
                      </div>
                    )}
                    {profileForm.dateOfBirth && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Date of Birth:</span>
                        <span className="font-medium">{new Date(profileForm.dateOfBirth).toLocaleDateString()}</span>
                      </div>
                    )}
                    {profileForm.phone && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Phone:</span>
                        <span className="font-medium">{profileForm.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Work Statistics */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h3 className="text-lg font-semibold mb-4">Work Statistics</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Tasks:</span>
                      <span className="font-medium">{stats.totalTasks}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Completed Tasks:</span>
                      <span className="font-medium text-green-600">{stats.completedTasks}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Active Projects:</span>
                      <span className="font-medium text-blue-600">{stats.activeProjects}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Open Tickets:</span>
                      <span className="font-medium text-orange-600">{stats.openTickets}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Unread Notifications:</span>
                      <span className="font-medium text-red-600">{stats.unreadNotifications}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              {(profileForm.address || profileForm.emergencyContact || profileForm.skills || profileForm.bio) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Contact Information */}
                  {(profileForm.address || profileForm.emergencyContact) && (
                    <div className="bg-white rounded-xl shadow-sm border p-6">
                      <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
                      <div className="space-y-3">
                        {profileForm.address && (
                    <div>
                            <span className="text-gray-600 block mb-1">Address:</span>
                            <span className="font-medium">{profileForm.address}</span>
                    </div>
                        )}
                        {profileForm.emergencyContact && (
                    <div>
                            <span className="text-gray-600 block mb-1">Emergency Contact:</span>
                            <span className="font-medium">{profileForm.emergencyContact}</span>
                    </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Skills & Bio */}
                  {(profileForm.skills || profileForm.bio) && (
                    <div className="bg-white rounded-xl shadow-sm border p-6">
                      <h3 className="text-lg font-semibold mb-4">Skills & Bio</h3>
                      <div className="space-y-3">
                        {profileForm.skills && (
                    <div>
                            <span className="text-gray-600 block mb-1">Skills:</span>
                            <span className="font-medium">{profileForm.skills}</span>
                    </div>
                        )}
                        {profileForm.bio && (
                    <div>
                            <span className="text-gray-600 block mb-1">Bio:</span>
                            <span className="font-medium">{profileForm.bio}</span>
                    </div>
                        )}
                  </div>
                </div>
                  )}
                </div>
              )}

              {/* Quick Actions */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => setActiveTab('tasks')}
                    className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-left"
                  >
                    <CheckSquare className="h-6 w-6 text-blue-600 mb-2" />
                    <h4 className="font-medium">View My Tasks</h4>
                    <p className="text-sm text-gray-600">Manage your assigned tasks</p>
                  </button>
                  <button
                    onClick={() => setActiveTab('projects')}
                    className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-left"
                  >
                    <Briefcase className="h-6 w-6 text-green-600 mb-2" />
                    <h4 className="font-medium">View My Projects</h4>
                    <p className="text-sm text-gray-600">Track project progress</p>
                  </button>
                  <button
                    onClick={() => setActiveTab('tickets')}
                    className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors text-left"
                  >
                    <Ticket className="h-6 w-6 text-purple-600 mb-2" />
                    <h4 className="font-medium">Create Ticket</h4>
                    <p className="text-sm text-gray-600">Report issues or requests</p>
                  </button>
              </div>
            </div>
          </div>
        )}
      </main>
      </div>

      {/* Update Modal */}
      {showUpdateModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Update {selectedItem.type}</h3>
                <button
                  onClick={() => {
                    setShowUpdateModal(false);
                    setSelectedItem(null);
                    setUpdateForm({ status: '', comments: '' });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
                  </div>
                </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={updateForm.status}
                  onChange={(e) => setUpdateForm({...updateForm, status: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {getStatusOptions(selectedItem.type).map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Comments</label>
                <textarea
                  value={updateForm.comments}
                  onChange={(e) => setUpdateForm({...updateForm, comments: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Add any comments or notes..."
                />
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowUpdateModal(false);
                  setSelectedItem(null);
                  setUpdateForm({ status: '', comments: '' });
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateItem}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Update
              </button>
            </div>
          </div>
                </div>
              )}

      {/* Create Ticket Modal */}
      {showCreateTicketModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Create New Ticket</h3>
                <button
                  onClick={() => {
                    setShowCreateTicketModal(false);
                    setCreateTicketForm({
                      title: '',
                      description: '',
                      category: 'general',
                      priority: 'medium'
                    });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={createTicketForm.title}
                  onChange={(e) => setCreateTicketForm({...createTicketForm, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter ticket title"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={createTicketForm.description}
                  onChange={(e) => setCreateTicketForm({...createTicketForm, description: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe the issue or request..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={createTicketForm.category}
                  onChange={(e) => setCreateTicketForm({...createTicketForm, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="general">General</option>
                  <option value="technical">Technical</option>
                  <option value="hr">HR</option>
                  <option value="it">IT Support</option>
                  <option value="facilities">Facilities</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <select
                  value={createTicketForm.priority}
                  onChange={(e) => setCreateTicketForm({...createTicketForm, priority: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCreateTicketModal(false);
                  setCreateTicketForm({
                    title: '',
                    description: '',
                    category: 'general',
                    priority: 'medium'
                  });
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTicket}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Create Ticket
              </button>
            </div>
            </div>
          </div>
        )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Settings</h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Change Password</label>
                <input
                  type="password"
                  placeholder="Enter new password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                <input
                  type="password"
                  placeholder="Confirm new password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                      </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notification Preferences</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded" defaultChecked />
                    <span className="ml-2 text-sm">Email notifications</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded" defaultChecked />
                    <span className="ml-2 text-sm">Task reminders</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded" defaultChecked />
                    <span className="ml-2 text-sm">Project updates</span>
                  </label>
                    </div>
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowSettings(false);
                  // Handle settings save
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Save Changes
                    </button>
                  </div>
                </div>
                </div>
              )}

      {/* Profile Edit Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Edit Profile</h3>
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
            </div>
          </div>
            <div className="p-6 space-y-6">
              {/* Profile Picture */}
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                    {profilePicture ? (
                      <img src={profilePicture} alt="Profile" className="w-20 h-20 rounded-full object-cover" />
                    ) : (
                      <User className="h-10 w-10 text-blue-600" />
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (e) => setProfilePicture(e.target.result);
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Profile Picture</h4>
                  <p className="text-sm text-gray-500">Click to upload a new photo</p>
                </div>
              </div>

              {/* Personal Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                  <select
                    value={profileForm.gender}
                    onChange={(e) => setProfileForm({...profileForm, gender: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                  <input
                    type="date"
                    value={profileForm.dateOfBirth}
                    onChange={(e) => setProfileForm({...profileForm, dateOfBirth: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                    <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter phone number"
                  />
                    </div>
                
                    <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Emergency Contact</label>
                  <input
                    type="text"
                    value={profileForm.emergencyContact}
                    onChange={(e) => setProfileForm({...profileForm, emergencyContact: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Emergency contact name and number"
                  />
                    </div>
              </div>

              {/* Address */}
                    <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                <textarea
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({...profileForm, address: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your address"
                />
                    </div>

              {/* Skills */}
                    <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Skills</label>
                <input
                  type="text"
                  value={profileForm.skills}
                  onChange={(e) => setProfileForm({...profileForm, skills: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., JavaScript, Python, Project Management"
                />
                    </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                <textarea
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm({...profileForm, bio: e.target.value})}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Tell us about yourself..."
                />
                  </div>
                </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <button
                onClick={() => setShowProfileModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowProfileModal(false);
                  // Handle profile save
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Save Changes
              </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default EmployeeDashboard;