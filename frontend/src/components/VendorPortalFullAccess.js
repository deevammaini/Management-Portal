import React, { useState, useEffect } from 'react';
import { 
  Home, Users, FileText, CheckCircle, Bell, LogOut, Building, 
  BarChart3, Settings, Send, Download, Plus, TrendingUp, Menu, X, 
  CheckSquare, Ticket, Clock, Calendar, Star, Award, Target, 
  MessageSquare, Upload, Eye, Edit, Trash2, Filter, Search
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

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, projectsData, tasksData, notificationsData] = await Promise.all([
        apiCall('/api/vendor/dashboard-stats'),
        apiCall('/api/vendor/projects'),
        apiCall('/api/vendor/tasks'),
        apiCall('/api/vendor/notifications')
      ]);
      
      setStats(statsData);
      setProjects(projectsData.projects || []);
      setTasks(tasksData.tasks || []);
      setNotifications(notificationsData.notifications || []);
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

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Welcome to YellowStone Vendor Portal</h1>
            <p className="text-amber-100 mt-2">Complete access to all vendor features and tools</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{user.company}</div>
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
              <p className="text-2xl font-bold text-gray-900">{stats.activeProjects || 0}</p>
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
              <p className="text-2xl font-bold text-gray-900">{stats.completedTasks || 0}</p>
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
              <p className="text-2xl font-bold text-gray-900">{stats.performanceScore || '95%'}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-amber-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-orange-100 to-red-100 rounded-xl">
              <MessageSquare className="text-orange-600" size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Messages</p>
              <p className="text-2xl font-bold text-gray-900">{stats.unreadMessages || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Projects */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Recent Projects</h3>
        </div>
        <div className="p-6">
          {projects.length > 0 ? (
            <div className="space-y-4">
              {projects.slice(0, 3).map((project) => (
                <div key={project.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg mr-4">
                      <Target className="text-blue-600" size={20} />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{project.name}</h4>
                      <p className="text-sm text-gray-600">{project.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      project.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {project.status}
                    </span>
                    <p className="text-sm text-gray-500 mt-1">{project.due_date}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Target className="mx-auto text-gray-400" size={48} />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No projects assigned</h3>
              <p className="mt-1 text-sm text-gray-500">You'll see your assigned projects here</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Tasks */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Recent Tasks</h3>
        </div>
        <div className="p-6">
          {tasks.length > 0 ? (
            <div className="space-y-4">
              {tasks.slice(0, 5).map((task) => (
                <div key={task.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg mr-4">
                      <CheckSquare className="text-green-600" size={20} />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{task.title}</h4>
                      <p className="text-sm text-gray-600">{task.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      task.status === 'Completed' ? 'bg-green-100 text-green-800' : 
                      task.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {task.status}
                    </span>
                    <p className="text-sm text-gray-500 mt-1">{task.due_date}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckSquare className="mx-auto text-gray-400" size={48} />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks assigned</h3>
              <p className="mt-1 text-sm text-gray-500">You'll see your assigned tasks here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

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

  const renderProfile = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Profile</h2>
      
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6">
          <div className="text-center py-12">
            <Building className="mx-auto text-gray-400" size={64} />
            <h3 className="mt-4 text-lg font-medium text-gray-900">Company Profile</h3>
            <p className="mt-2 text-gray-600">Manage your company information and settings</p>
          </div>
        </div>
      </div>
    </div>
  );

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
