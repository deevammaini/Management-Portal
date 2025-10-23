import React, { useState, useEffect } from 'react';
import { 
  Home, Users, FileText, CheckCircle, Bell, LogOut, Building, 
  BarChart3, Settings, Send, Download, Plus, TrendingUp, Menu, X, 
  CheckSquare, Ticket, Clock, Calendar, Star, Award, Target, 
  MessageSquare, Upload, Eye, Edit, Trash2, Filter, Search,
  Mail, Package, ClipboardList, FileCheck, Shield
} from 'lucide-react';
import { apiCall } from '../utils/api';

const VendorPortalFullAccess = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState({});
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);

  useEffect(() => {
    if (user?.id) {
      loadDashboardData();
    }
    if (activeTab === 'profile') {
      loadProfileData();
    }
  }, [activeTab, user?.id]);

  const loadProfileData = async () => {
    try {
      console.log('Loading profile data for user:', user);
      const response = await apiCall('/api/vendor/profile', {
        method: 'GET',
        headers: {
          'X-Vendor-ID': user?.id?.toString()
        }
      });
      
      console.log('Profile API response:', response);
      if (response.success) {
        setProfileData(response.profile);
      }
    } catch (error) {
      console.error('Failed to load profile data:', error);
    }
  };

  const downloadNDAForm = async () => {
    try {
      const response = await fetch('/api/vendor/nda-form/download', {
        method: 'GET',
        headers: {
          'X-Vendor-ID': user?.id,
          'Content-Type': 'application/pdf'
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `NDA_Form_${profileData?.company_name || 'Company'}_${profileData?.reference_number || 'NDA'}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        console.error('Failed to download NDA form');
      }
    } catch (error) {
      console.error('Error downloading NDA form:', error);
    }
  };

  const loadDashboardData = async () => {
    try {
      console.log('Loading dashboard data for user:', user);
      setLoading(true);
      const headers = {
        'X-Vendor-ID': user?.id?.toString()
      };
      
      console.log('Making API calls with headers:', headers);
      
      const [statsData, projectsData, tasksData, notificationsData] = await Promise.all([
        apiCall('/api/vendor/dashboard-stats', { method: 'GET', headers }),
        apiCall('/api/vendor/projects', { method: 'GET', headers }),
        apiCall('/api/vendor/tasks', { method: 'GET', headers }),
        apiCall('/api/vendor/notifications', { method: 'GET', headers })
      ]);
      
      console.log('API responses:', { statsData, projectsData, tasksData, notificationsData });
      
      if (statsData.success) {
        console.log('Setting stats:', statsData.stats);
        setStats(statsData.stats);
      }
      if (projectsData.success) {
        console.log('Setting projects:', projectsData.projects);
        setProjects(projectsData.projects || []);
      }
      if (tasksData.success) {
        console.log('Setting tasks:', tasksData.tasks);
        setTasks(tasksData.tasks || []);
      }
      if (notificationsData.success) {
        console.log('Setting notifications:', notificationsData.notifications);
        setNotifications(notificationsData.notifications || []);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('user');
    onLogout();
  };

  const handleNewProject = () => {
    const projectModal = document.createElement('div');
    projectModal.innerHTML = `
      <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center;" onclick="this.remove()">
        <div style="background: white; padding: 30px; border-radius: 10px; max-width: 500px; text-align: center;" onclick="event.stopPropagation()">
          <h3 style="color: #f59e0b; margin-bottom: 15px;">New Project Request</h3>
          <p style="margin-bottom: 20px;">To create a new project, please contact the YellowStone team with your project proposal.</p>
          <div style="background: #f3f4f6; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <p style="margin: 0; font-weight: bold;">Contact Information:</p>
            <p style="margin: 5px 0;">Email: projects@yellowstone.com</p>
            <p style="margin: 5px 0;">Phone: +91-9876543210</p>
          </div>
          <button onclick="this.parentElement.parentElement.remove()" style="background: #f59e0b; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">Close</button>
        </div>
      </div>
    `;
    document.body.appendChild(projectModal);
  };

  const handleUploadDeliverable = () => {
    const uploadModal = document.createElement('div');
    uploadModal.innerHTML = `
      <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center;" onclick="this.remove()">
        <div style="background: white; padding: 30px; border-radius: 10px; max-width: 500px; text-align: center;" onclick="event.stopPropagation()">
          <h3 style="color: #10b981; margin-bottom: 15px;">Upload Deliverable</h3>
          <p style="margin-bottom: 20px;">Upload your completed project deliverables here.</p>
          <div style="border: 2px dashed #d1d5db; padding: 30px; border-radius: 5px; margin-bottom: 20px;">
            <p style="margin: 0; color: #6b7280;">Drag & drop files here or click to browse</p>
            <input type="file" multiple style="margin-top: 10px;" />
          </div>
          <div style="display: flex; gap: 10px; justify-content: center;">
            <button onclick="this.parentElement.parentElement.remove()" style="background: #6b7280; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">Cancel</button>
            <button onclick="alert('Upload functionality will be implemented soon!'); this.parentElement.parentElement.remove()" style="background: #10b981; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">Upload</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(uploadModal);
  };

  const handleSendMessage = () => {
    const messageModal = document.createElement('div');
    messageModal.innerHTML = `
      <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center;" onclick="this.remove()">
        <div style="background: white; padding: 30px; border-radius: 10px; max-width: 500px; width: 90%;" onclick="event.stopPropagation()">
          <h3 style="color: #8b5cf6; margin-bottom: 15px;">Send Message</h3>
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">To:</label>
            <select style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 5px;">
              <option>YellowStone Project Manager</option>
              <option>YellowStone Support Team</option>
              <option>YellowStone Finance Team</option>
            </select>
          </div>
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Subject:</label>
            <input type="text" placeholder="Enter message subject" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 5px;" />
          </div>
          <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Message:</label>
            <textarea placeholder="Enter your message" rows="4" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 5px; resize: vertical;"></textarea>
          </div>
          <div style="display: flex; gap: 10px; justify-content: flex-end;">
            <button onclick="this.parentElement.parentElement.remove()" style="background: #6b7280; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">Cancel</button>
            <button onclick="alert('Message sent successfully!'); this.parentElement.parentElement.remove()" style="background: #8b5cf6; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">Send</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(messageModal);
  };

  const handleViewReports = () => {
    const reportsModal = document.createElement('div');
    reportsModal.innerHTML = `
      <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center;" onclick="this.remove()">
        <div style="background: white; padding: 30px; border-radius: 10px; max-width: 600px; width: 90%;" onclick="event.stopPropagation()">
          <h3 style="color: #f97316; margin-bottom: 20px;">Performance Reports</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
            <div style="background: #f3f4f6; padding: 15px; border-radius: 5px; text-align: center;">
              <h4 style="margin: 0 0 10px 0; color: #374151;">Project Completion Rate</h4>
              <p style="margin: 0; font-size: 24px; font-weight: bold; color: #10b981;">95%</p>
            </div>
            <div style="background: #f3f4f6; padding: 15px; border-radius: 5px; text-align: center;">
              <h4 style="margin: 0 0 10px 0; color: #374151;">On-Time Delivery</h4>
              <p style="margin: 0; font-size: 24px; font-weight: bold; color: #3b82f6;">88%</p>
            </div>
            <div style="background: #f3f4f6; padding: 15px; border-radius: 5px; text-align: center;">
              <h4 style="margin: 0 0 10px 0; color: #374151;">Client Satisfaction</h4>
              <p style="margin: 0; font-size: 24px; font-weight: bold; color: #f59e0b;">4.8/5</p>
            </div>
            <div style="background: #f3f4f6; padding: 15px; border-radius: 5px; text-align: center;">
              <h4 style="margin: 0 0 10px 0; color: #374151;">Total Projects</h4>
              <p style="margin: 0; font-size: 24px; font-weight: bold; color: #8b5cf6;">12</p>
            </div>
          </div>
          <div style="text-align: center;">
            <button onclick="alert('Detailed reports will be available soon!'); this.parentElement.parentElement.remove()" style="background: #f97316; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin-right: 10px;">Download Report</button>
            <button onclick="this.parentElement.parentElement.remove()" style="background: #6b7280; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">Close</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(reportsModal);
  };

  const handleViewAllProjects = () => {
    setActiveTab('projects');
  };

  const handleViewAllTasks = () => {
    setActiveTab('tasks');
  };

  const renderDashboard = () => {
    const unreadNotifications = notifications.filter(n => !n.read).length;
    
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard data...</p>
          </div>
        </div>
      );
    }
    
    return (
      <div className="space-y-6 p-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Welcome to YellowStone Vendor Portal</h1>
            <p className="text-amber-100 mt-2">Complete access to all vendor features and tools</p>
          </div>
          <div className="text-right">
              <div className="text-3xl font-bold">{user?.company || 'TEST AGENT'}</div>
            <div className="text-amber-100 flex items-center">
              <Award className="w-4 h-4 mr-1" />
              Approved Vendor
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-amber-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl">
              <Target className="text-amber-600" size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Projects</p>
                <p className="text-2xl font-bold text-gray-900">{stats.active_projects || 0}</p>
              </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-amber-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl">
              <CheckSquare className="text-green-600" size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed Tasks</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completed_tasks || 0}</p>
              </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-amber-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-yellow-100 to-amber-100 rounded-xl">
              <Award className="text-yellow-600" size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Performance Score</p>
                <p className="text-2xl font-bold text-gray-900">{stats.performance_score || 0}%</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-amber-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-red-100 to-pink-100 rounded-xl">
                <Bell className="text-red-600" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Notifications</p>
                <p className="text-2xl font-bold text-gray-900">{unreadNotifications}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Financial Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-amber-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Overview</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Earnings</span>
                <span className="text-2xl font-bold text-green-600">₹{stats.total_earnings?.toLocaleString() || '0'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">This Month</span>
                <span className="text-xl font-semibold text-blue-600">₹{stats.monthly_earnings?.toLocaleString() || '0'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Pending Payments</span>
                <span className="text-lg font-medium text-orange-600">₹0</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-amber-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={handleNewProject}
                className="p-3 bg-blue-50 hover:bg-blue-100 rounded-lg text-blue-700 font-medium transition-colors cursor-pointer flex flex-col items-center"
              >
                <Plus className="mb-1" size={20} />
                <span className="text-sm">New Project</span>
              </button>
              <button 
                onClick={handleUploadDeliverable}
                className="p-3 bg-green-50 hover:bg-green-100 rounded-lg text-green-700 font-medium transition-colors cursor-pointer flex flex-col items-center"
              >
                <Upload className="mb-1" size={20} />
                <span className="text-sm">Upload Deliverable</span>
              </button>
              <button 
                onClick={handleSendMessage}
                className="p-3 bg-purple-50 hover:bg-purple-100 rounded-lg text-purple-700 font-medium transition-colors cursor-pointer flex flex-col items-center"
              >
                <MessageSquare className="mb-1" size={20} />
                <span className="text-sm">Send Message</span>
              </button>
              <button 
                onClick={handleViewReports}
                className="p-3 bg-orange-50 hover:bg-orange-100 rounded-lg text-orange-700 font-medium transition-colors cursor-pointer flex flex-col items-center"
              >
                <FileText className="mb-1" size={20} />
                <span className="text-sm">View Reports</span>
              </button>
          </div>
        </div>
      </div>

        {/* Projects and Tasks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Projects */}
          <div className="bg-white rounded-lg shadow-sm border border-amber-200">
            <div className="p-6 border-b border-amber-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Active Projects</h3>
                <button 
                  onClick={handleViewAllProjects}
                  className="text-amber-600 hover:text-amber-700 font-medium cursor-pointer"
                >
                  View All
                </button>
              </div>
            </div>
            <div className="p-6">
          {projects.length > 0 ? (
            <div className="space-y-4">
              {projects.slice(0, 3).map((project) => (
                    <div key={project.id} className="border border-amber-200 rounded-lg p-4 hover:bg-amber-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{project.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">{project.description}</p>
                          <div className="flex items-center mt-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3">
                              <div 
                                className="bg-amber-500 h-2 rounded-full" 
                                style={{ width: `${project.progress}%` }}
                              ></div>
                    </div>
                            <span className="text-sm text-gray-600">{project.progress}%</span>
                    </div>
                  </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          project.status === 'active' ? 'bg-green-100 text-green-800' :
                          project.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                    }`}>
                      {project.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Target className="mx-auto text-gray-400" size={48} />
                  <p className="text-gray-500 mt-2">No active projects</p>
                  <p className="text-sm text-gray-400">You'll see your assigned projects here</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Tasks */}
          <div className="bg-white rounded-lg shadow-sm border border-amber-200">
            <div className="p-6 border-b border-amber-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Recent Tasks</h3>
                <button 
                  onClick={handleViewAllTasks}
                  className="text-amber-600 hover:text-amber-700 font-medium cursor-pointer"
                >
                  View All
                </button>
              </div>
        </div>
        <div className="p-6">
          {tasks.length > 0 ? (
                <div className="space-y-3">
                  {tasks.slice(0, 4).map((task) => (
                    <div key={task.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-amber-50 transition-colors">
                      <div className={`w-3 h-3 rounded-full ${
                        task.status === 'completed' ? 'bg-green-500' :
                        task.status === 'in_progress' ? 'bg-blue-500' :
                        'bg-gray-300'
                      }`}></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                        <p className="text-xs text-gray-500">Due: {new Date(task.due_date).toLocaleDateString()}</p>
                    </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        task.priority === 'high' ? 'bg-red-100 text-red-800' :
                        task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {task.priority}
                      </span>
                    </div>
                  ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckSquare className="mx-auto text-gray-400" size={48} />
                  <p className="text-gray-500 mt-2">No tasks assigned</p>
                  <p className="text-sm text-gray-400">You'll see your tasks here</p>
            </div>
          )}
        </div>
      </div>
        </div>

        {/* Notifications */}
        {notifications.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-amber-200">
            <div className="p-6 border-b border-amber-200">
              <h3 className="text-lg font-semibold text-gray-900">Recent Notifications</h3>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {notifications.slice(0, 3).map((notification) => (
                  <div key={notification.id} className={`p-4 rounded-lg border-l-4 ${
                    notification.type === 'approval' ? 'border-yellow-400 bg-yellow-50' :
                    notification.type === 'payment' ? 'border-green-400 bg-green-50' :
                    'border-blue-400 bg-blue-50'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{notification.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(notification.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
    </div>
  );
  };

  const renderProjects = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Projects</h2>
        <button className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all duration-200 shadow-md hover:shadow-lg">
          <Plus className="w-4 h-4 mr-2 inline" />
          New Project
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6">
          <div className="text-center py-12">
            <Target className="mx-auto text-gray-400" size={64} />
            <h3 className="mt-4 text-lg font-medium text-gray-900">Project Management</h3>
            <p className="mt-2 text-gray-600">Full project management features will be available here</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTasks = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Tasks</h2>
        <button className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all duration-200 shadow-md hover:shadow-lg">
          <Plus className="w-4 h-4 mr-2 inline" />
          New Task
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6">
          <div className="text-center py-12">
            <CheckSquare className="mx-auto text-gray-400" size={64} />
            <h3 className="mt-4 text-lg font-medium text-gray-900">Task Management</h3>
            <p className="mt-2 text-gray-600">Full task management features will be available here</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMessages = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Messages</h2>
        <button className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all duration-200 shadow-md hover:shadow-lg">
          <Send className="w-4 h-4 mr-2 inline" />
          New Message
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6">
          <div className="text-center py-12">
            <MessageSquare className="mx-auto text-gray-400" size={64} />
            <h3 className="mt-4 text-lg font-medium text-gray-900">Communication Portal</h3>
            <p className="mt-2 text-gray-600">Direct communication with YellowStone team</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDocuments = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Documents</h2>
        <button className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all duration-200 shadow-md hover:shadow-lg">
          <Upload className="w-4 h-4 mr-2 inline" />
          Upload Document
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6">
          <div className="text-center py-12">
            <FileText className="mx-auto text-gray-400" size={64} />
            <h3 className="mt-4 text-lg font-medium text-gray-900">Document Management</h3>
            <p className="mt-2 text-gray-600">Upload and manage your project documents</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderProfile = () => {
    const profile = profileData || {};
    const comprehensive = profile?.comprehensive_data || {};
    
    // Debug logging
    console.log('Profile data:', profile);
    console.log('Comprehensive data:', comprehensive);
    
    return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Company Profile</h2>
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              profile?.registration_status === 'approved' 
                ? 'bg-green-100 text-green-800' 
                : profile?.registration_status === 'pending'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {profile?.registration_status?.charAt(0).toUpperCase() + profile?.registration_status?.slice(1) || 'Unknown'}
            </span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              profile?.nda_status === 'completed' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              NDA {profile?.nda_status === 'completed' ? 'Completed' : 'Pending'}
            </span>
          </div>
        </div>

        {/* Company Overview Card */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
                  <Building className="text-white" size={32} />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-semibold text-gray-900">{profile?.company_name || 'Company Name'}</h3>
                <p className="text-gray-600 mt-1">{profile?.business_type || 'Business Type'}</p>
                <div className="mt-2 flex items-center text-sm text-gray-500">
                  <span className="mr-4">Ref: {profile?.reference_number || 'N/A'}</span>
                  <span>Established: {comprehensive?.yearOfEstablishment || comprehensive?.dateOfEstablishment || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Company Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Contact Information */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Mail className="mr-2 text-amber-600" size={20} />
                Contact Information
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Contact Person</label>
                  <p className="text-gray-900">{profile?.contact_person || comprehensive?.contactPersonName || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-gray-900">{profile?.email || comprehensive?.emailAddress || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Phone</label>
                  <p className="text-gray-900">{profile?.phone || comprehensive?.phoneNumber || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Address</label>
                  <p className="text-gray-900">{profile?.address || comprehensive?.communicationAddress || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Business Information */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Building className="mr-2 text-amber-600" size={20} />
                Business Information
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Company Type</label>
                  <p className="text-gray-900">{comprehensive?.companyType || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Registration Number</label>
                  <p className="text-gray-900">{profile?.registration_number || comprehensive?.panNumber || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Nature of Business</label>
                  <p className="text-gray-900">{comprehensive?.natureOfBusiness || comprehensive?.coreBusinessActivity || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Country/State</label>
                  <p className="text-gray-900">{profile?.country || 'N/A'}{profile?.state ? `, ${profile.state}` : ''}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Information */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Package className="mr-2 text-amber-600" size={20} />
                Financial Information
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Annual Turnover</label>
                  <p className="text-gray-900">{comprehensive?.annualTurnover || comprehensive?.turnoverYear3 || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Net Worth</label>
                  <p className="text-gray-900">{comprehensive?.netWorth || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Bank Name</label>
                  <p className="text-gray-900">{comprehensive?.bankName || comprehensive?.supplierBankName || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Account Number</label>
                  <p className="text-gray-900">{comprehensive?.accountNumber || comprehensive?.supplierAccountNumber || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Capabilities & Services */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <ClipboardList className="mr-2 text-amber-600" size={20} />
                Capabilities & Services
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Services Offered</label>
                  <p className="text-gray-900">{comprehensive?.servicesOffered || comprehensive?.servicesToExistingClients || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Technical Capabilities</label>
                  <p className="text-gray-900">{comprehensive?.technicalCapabilities || comprehensive?.machineryToolsAvailable || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Total Employees</label>
                  <p className="text-gray-900">{comprehensive?.totalEmployees || comprehensive?.totalTeamsAvailable || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Certifications</label>
                  <p className="text-gray-900">{comprehensive?.certifications || comprehensive?.qualityCertifications || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        {(comprehensive?.majorCustomers || comprehensive?.previousWorkExperience || comprehensive?.additionalInformation) && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h4>
              <div className="space-y-4">
                {comprehensive?.majorCustomers && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Major Customers</label>
                    <p className="text-gray-900 mt-1">{comprehensive.majorCustomers}</p>
                  </div>
                )}
                {comprehensive?.previousWorkExperience && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Previous Work Experience</label>
                    <p className="text-gray-900 mt-1">{comprehensive.previousWorkExperience}</p>
                  </div>
                )}
                {comprehensive?.additionalInformation && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Additional Information</label>
                    <p className="text-gray-900 mt-1">{comprehensive.additionalInformation}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Registration Timeline */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Registration Timeline</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Account Created</span>
                <span className="text-sm text-gray-900">{profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}</span>
              </div>
              {profile?.submitted_at && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Registration Submitted</span>
                  <span className="text-sm text-gray-900">{new Date(profile.submitted_at).toLocaleDateString()}</span>
                </div>
              )}
              {profile?.reviewed_at && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Last Reviewed</span>
                  <span className="text-sm text-gray-900">{new Date(profile.reviewed_at).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* NDA Form Section */}
        {profile?.nda_status === 'completed' && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Shield className="mr-2 text-green-600" size={20} />
                  Non-Disclosure Agreement (NDA)
                </h4>
                <button
                  onClick={downloadNDAForm}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2 transition-colors"
                >
                  <Download size={16} />
                  <span>Download NDA</span>
                </button>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div className="flex items-center">
                  <CheckCircle className="text-green-600 mr-2" size={20} />
                  <div>
                    <h5 className="font-medium text-green-900">NDA Completed</h5>
                    <p className="text-sm text-green-700">
                      Your Non-Disclosure Agreement has been successfully completed and signed.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Signed Date</label>
                  <p className="text-gray-900">{profile?.signed_date ? new Date(profile.signed_date).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Signature Type</label>
                  <p className="text-gray-900">{profile?.signature_type || 'Digital'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Reference Number</label>
                  <p className="text-gray-900">{profile?.reference_number || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <p className="text-gray-900">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Completed
                    </span>
                  </p>
                </div>
              </div>

              {profile?.signature_data && (
                <div className="mt-4">
                  <label className="text-sm font-medium text-gray-500">Digital Signature</label>
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg border">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Signature captured</span>
                      <CheckCircle className="text-green-600" size={16} />
                    </div>
                  </div>
                </div>
              )}

              {profile?.company_stamp_data && (
                <div className="mt-4">
                  <label className="text-sm font-medium text-gray-500">Company Stamp</label>
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg border">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Company stamp uploaded</span>
                      <CheckCircle className="text-green-600" size={16} />
                    </div>
                  </div>
                </div>
              )}
        </div>
      </div>
        )}
    </div>
  );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Menu size={24} />
              </button>
              <div className="flex items-center ml-4 lg:ml-0">
                <div className="p-2 bg-gradient-to-br from-amber-100 to-orange-100 rounded-lg mr-3">
                  <Building className="text-amber-600" size={24} />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">YellowStone Portal</h1>
                  <p className="text-sm text-amber-600 font-medium">Full Access</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.company}</p>
                <p className="text-xs text-gray-500">Approved Vendor</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white shadow-lg border-r transform transition-transform duration-200 ease-in-out`}>
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="p-6 border-b border-amber-200">
              <div className="flex items-center">
                <div className="p-2 bg-gradient-to-br from-amber-100 to-orange-100 rounded-lg mr-3">
                  <Building className="text-amber-600" size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">YellowStone</h2>
                  <p className="text-sm text-amber-600 font-medium">Vendor Portal</p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4">
              <div className="space-y-2">
                {[
                  { id: 'dashboard', label: 'Dashboard', icon: Home },
                  { id: 'projects', label: 'Projects', icon: Target },
                  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
                  { id: 'messages', label: 'Messages', icon: MessageSquare },
                  { id: 'documents', label: 'Documents', icon: FileText },
                  { id: 'profile', label: 'Profile', icon: Building }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-amber-50 to-orange-50 text-amber-600 border-r-2 border-amber-500'
                        : 'text-gray-600 hover:bg-gradient-to-r hover:from-amber-25 hover:to-orange-25 hover:text-gray-900'
                    }`}
                  >
                    <tab.icon size={20} />
                    {tab.label}
                  </button>
                ))}
              </div>
            </nav>

            {/* User Info */}
            <div className="p-4 border-t border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center">
                  <Building className="text-amber-600" size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{user.company}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
              </div>
              <div className="text-xs text-green-600 font-medium flex items-center">
                <Award className="w-3 h-3 mr-1" />
                Full Portal Access
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-0">
          <div className="p-6">
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'projects' && renderProjects()}
            {activeTab === 'tasks' && renderTasks()}
            {activeTab === 'messages' && renderMessages()}
            {activeTab === 'documents' && renderDocuments()}
            {activeTab === 'profile' && renderProfile()}
          </div>
        </main>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default VendorPortalFullAccess;
