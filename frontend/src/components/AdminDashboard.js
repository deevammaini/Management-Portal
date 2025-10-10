import React, { useState, useEffect } from 'react';
import { 
  Users, FileText, CheckCircle, Bell, LogOut, Home, Briefcase,
  BarChart3, Settings, Send, Download, Plus, TrendingUp, Menu, X, CheckSquare, Ticket, ClipboardList
} from 'lucide-react';
import { apiCall } from '../utils/api';
import StatsCard from './StatsCard';
import Notification from './Notification';
import AnalyticsView from './AnalyticsView';
import VendorsView from './VendorsView';
import RegistrationFormsView from './RegistrationFormsView';
import FormsView from './FormsView';
import NDAFormsView from './NDAFormsView';
import SettingsView from './SettingsView';
import OrganizationStructureView from './OrganizationStructureView';
import TasksView from './TasksView';
import ProjectsView from './ProjectsView';
import TicketsView from './TicketsView';
import AttendanceView from './AttendanceView';
import SendNDAModal from './SendNDAModal';
import BulkSendNDAModal from './BulkSendNDAModal';

const AdminDashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [vendors, setVendors] = useState([]);
  const [submittedForms, setSubmittedForms] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showBulkSendModal, setShowBulkSendModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showReports, setShowReports] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [vendorsData, formsData, statsData, notificationsData] = await Promise.all([
        apiCall('/api/admin/vendors'),
        apiCall('/api/admin/submitted-nda-forms'),
        apiCall('/api/dashboard/stats'),
        apiCall('/api/admin/notifications')
      ]);
      
      setVendors(vendorsData);
      setSubmittedForms(formsData);
      setNotifications(notificationsData.notifications || []);
      
      const metadata = vendorsData.find(v => v.id === 'metadata');
      setStats({
        totalVendors: vendorsData.filter(v => v.id !== 'metadata').length,
        ndaCompleted: metadata?.nda_completed_count || 0,
        ndaSent: metadata?.nda_sent_count || 0,
        portalAccess: metadata?.portal_access_count || 0,
        ...statsData
      });
    } catch (error) {
      showNotification('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
  };

  const handleExportData = async () => {
    try {
      showNotification('Preparing data export...', 'info');
      
      // Create CSV data
      const csvData = [];
      
      // Add vendors data
      csvData.push(['VENDORS DATA']);
      csvData.push(['Company Name', 'Email', 'Contact Person', 'Phone', 'Address', 'Status', 'Reference Number', 'Created Date']);
      vendors.forEach(vendor => {
        csvData.push([
          vendor.company_name || '',
          vendor.email || '',
          vendor.contact_person || '',
          vendor.phone || '',
          vendor.address || '',
          vendor.status || '',
          vendor.reference_number || '',
          vendor.created_at || ''
        ]);
      });
      
      csvData.push([]); // Empty row
      
      // Add submitted forms data
      csvData.push(['SUBMITTED FORMS DATA']);
      csvData.push(['Company Name', 'Email', 'Status', 'Submitted Date', 'Reference Number']);
      submittedForms.forEach(form => {
        csvData.push([
          form.company_name || '',
          form.email || '',
          form.status || '',
          form.submitted_at || '',
          form.reference_number || ''
        ]);
      });
      
      // Convert to CSV string
      const csvString = csvData.map(row => 
        row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
      ).join('\n');
      
      // Create and download file
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `yellowstone_xps_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showNotification('Data exported successfully!', 'success');
    } catch (error) {
      console.error('Export error:', error);
      showNotification('Failed to export data', 'error');
    }
  };

  const handleSendNDA = async (vendor) => {
    try {
      await apiCall('/api/admin/send-nda', {
        method: 'POST',
        body: JSON.stringify(vendor)
      });
      showNotification(`NDA sent to ${vendor.company_name || vendor.email}!`, 'success');
      loadData();
    } catch (error) {
      showNotification('Failed to send NDA', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
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
            <p className="text-xs text-gray-500">Management Portal</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: Home },
              { id: 'analytics', label: 'Analytics', icon: BarChart3 },
              { id: 'vendors', label: 'Vendors', icon: Users },
              { id: 'registration-forms', label: 'Registration Forms', icon: ClipboardList },
              { id: 'forms', label: 'Forms', icon: FileText },
              { id: 'nda-forms', label: 'NDA Forms', icon: FileText },
              { id: 'tasks', label: 'Tasks', icon: CheckSquare },
              { id: 'projects', label: 'Projects', icon: Briefcase },
              { id: 'tickets', label: 'Tickets', icon: Ticket },
              { id: 'attendance', label: 'Attendance Info', icon: CheckCircle },
              { id: 'organization', label: 'Organization', icon: Users }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSidebarOpen(false); // Close sidebar on mobile after selection
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-amber-50 text-amber-600 border-r-2 border-amber-500'
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
            <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">A</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{user.name || 'Admin'}</p>
              <p className="text-xs text-gray-500">Administrator</p>
            </div>
          </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setShowSettings(true)}
                    className="flex-1 p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                    title="Settings"
                  >
                    <Settings size={16} />
                  </button>
                  <button onClick={onLogout} className="flex-1 p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors" title="Logout">
                    <LogOut size={16} />
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
                    {activeTab.replace('-', ' ')}
                  </h2>
                  <p className="text-gray-600">Welcome back, {user.name || 'Admin'}!</p>
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
                            <div key={index} className="p-4 border-b hover:bg-gray-50 cursor-pointer">
                              <div className="flex items-start gap-3">
                                <div className={`w-3 h-3 rounded-full mt-1 ${
                                  notif.type === 'vendor_nda_submitted' ? 'bg-green-500' : 'bg-blue-500'
                                }`}></div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">{notif.title}</p>
                                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">{notif.message}</p>
                                  <p className="text-xs text-gray-400 mt-2">{new Date(notif.created_at).toLocaleString()}</p>
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
                
                <button 
                  onClick={() => setShowSendModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg hover:from-amber-600 hover:to-orange-700 transition-all shadow-md"
                >
                  <Send size={16} />
                  Send NDA
                </button>
                
                <button 
                  onClick={() => setShowBulkSendModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-md"
                >
                  <Plus size={16} />
                  Bulk Send
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 overflow-auto">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatsCard
                icon={Users}
                title="Total Vendors"
                value={stats.totalVendors}
                color="bg-gradient-to-br from-blue-500 to-blue-600"
                trend="+12%"
              />
              <StatsCard
                icon={CheckCircle}
                title="NDA Completed"
                value={stats.ndaCompleted}
                color="bg-gradient-to-br from-green-500 to-green-600"
                trend="+8%"
              />
              <StatsCard
                icon={FileText}
                title="Total Tasks"
                value={stats.total_tasks || 0}
                color="bg-gradient-to-br from-purple-500 to-purple-600"
              />
              <StatsCard
                icon={Briefcase}
                title="Projects"
                value={stats.total_projects || 0}
                color="bg-gradient-to-br from-amber-500 to-amber-600"
              />
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm p-6 border">
              <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <button
                  onClick={() => setShowSendModal(true)}
                  className="flex flex-col items-center gap-3 p-6 bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-xl hover:shadow-lg transition-all"
                >
                  <Send size={24} />
                  <span className="font-semibold">Send NDA</span>
                </button>
                <button
                  onClick={() => setShowBulkSendModal(true)}
                  className="flex flex-col items-center gap-3 p-6 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl hover:shadow-lg transition-all"
                >
                  <Users size={24} />
                  <span className="font-semibold">Bulk Send NDA</span>
                </button>
                <button 
                  onClick={handleExportData}
                  className="flex flex-col items-center gap-3 p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all"
                >
                  <Download size={24} />
                  <span className="font-semibold">Export Data</span>
                </button>
                <button 
                  onClick={() => setShowReports(true)}
                  className="flex flex-col items-center gap-3 p-6 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all"
                >
                  <BarChart3 size={24} />
                  <span className="font-semibold">View Reports</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && <AnalyticsView stats={stats} vendors={vendors} />}
        {activeTab === 'vendors' && <VendorsView vendors={vendors} onSendNDA={handleSendNDA} onReload={loadData} showNotification={showNotification} />}
        {activeTab === 'registration-forms' && <RegistrationFormsView showNotification={showNotification} />}
        {activeTab === 'forms' && <FormsView forms={submittedForms} showNotification={showNotification} />}
        {activeTab === 'nda-forms' && <NDAFormsView showNotification={showNotification} />}
        {activeTab === 'tasks' && <TasksView showNotification={showNotification} />}
        {activeTab === 'projects' && <ProjectsView showNotification={showNotification} />}
        {activeTab === 'tickets' && <TicketsView showNotification={showNotification} />}
        {activeTab === 'attendance' && <AttendanceView showNotification={showNotification} />}
        {activeTab === 'organization' && <OrganizationStructureView showNotification={showNotification} />}
        </main>
      </div>

      {showSendModal && (
        <SendNDAModal
          onClose={() => setShowSendModal(false)}
          onSend={(data) => {
            handleSendNDA(data);
            setShowSendModal(false);
          }}
        />
      )}

      {showBulkSendModal && (
        <BulkSendNDAModal
          onClose={() => setShowBulkSendModal(false)}
          vendors={vendors}
          onSuccess={(message) => {
            showNotification(message, 'success');
            loadData();
          }}
        />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b flex-shrink-0">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">System Settings</h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="overflow-y-auto flex-1 modal-scrollbar">
              <SettingsView showNotification={showNotification} />
            </div>
          </div>
        </div>
      )}

      {showReports && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b flex-shrink-0">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">Reports & Analytics</h3>
                <button
                  onClick={() => setShowReports(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto flex-1 modal-scrollbar">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Summary Cards */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-blue-900 mb-4">Vendor Summary</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-blue-700">Total Vendors:</span>
                      <span className="font-semibold text-blue-900">{vendors.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Active Vendors:</span>
                      <span className="font-semibold text-blue-900">{vendors.filter(v => v.status === 'active').length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Pending Approval:</span>
                      <span className="font-semibold text-blue-900">{vendors.filter(v => v.status === 'pending').length}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-green-900 mb-4">Forms Summary</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-green-700">Total Forms:</span>
                      <span className="font-semibold text-green-900">{submittedForms.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700">Completed Forms:</span>
                      <span className="font-semibold text-green-900">{submittedForms.filter(f => f.status === 'completed').length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700">Pending Forms:</span>
                      <span className="font-semibold text-green-900">{submittedForms.filter(f => f.status === 'pending').length}</span>
                    </div>
                  </div>
                </div>

                {/* Charts Section */}
                <div className="lg:col-span-2 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-purple-900 mb-4">Monthly Trends</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-purple-600">{stats.totalVendors || 0}</div>
                      <div className="text-sm text-purple-700">Total Vendors</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-purple-600">{stats.totalForms || 0}</div>
                      <div className="text-sm text-purple-700">Total Forms</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-purple-600">{stats.completionRate || 0}%</div>
                      <div className="text-sm text-purple-700">Completion Rate</div>
                    </div>
                  </div>
                </div>

                {/* Export Options */}
                <div className="lg:col-span-2 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-amber-900 mb-4">Export Options</h4>
                  <div className="flex gap-3">
                    <button
                      onClick={handleExportData}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      <Download size={16} />
                      Export All Data
                    </button>
                    <button
                      onClick={() => {
                        // Export vendors only
                        const csvData = [['Company Name', 'Email', 'Contact Person', 'Phone', 'Address', 'Status', 'Reference Number']];
                        vendors.forEach(vendor => {
                          csvData.push([
                            vendor.company_name || '',
                            vendor.email || '',
                            vendor.contact_person || '',
                            vendor.phone || '',
                            vendor.address || '',
                            vendor.status || '',
                            vendor.reference_number || ''
                          ]);
                        });
                        const csvString = csvData.map(row => 
                          row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
                        ).join('\n');
                        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
                        const link = document.createElement('a');
                        const url = URL.createObjectURL(blob);
                        link.setAttribute('href', url);
                        link.setAttribute('download', `vendors_export_${new Date().toISOString().split('T')[0]}.csv`);
                        link.style.visibility = 'hidden';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        showNotification('Vendors data exported successfully!', 'success');
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                    >
                      <Download size={16} />
                      Export Vendors
                    </button>
                    <button
                      onClick={() => {
                        // Export forms only
                        const csvData = [['Company Name', 'Email', 'Status', 'Submitted Date', 'Reference Number']];
                        submittedForms.forEach(form => {
                          csvData.push([
                            form.company_name || '',
                            form.email || '',
                            form.status || '',
                            form.submitted_at || '',
                            form.reference_number || ''
                          ]);
                        });
                        const csvString = csvData.map(row => 
                          row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
                        ).join('\n');
                        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
                        const link = document.createElement('a');
                        const url = URL.createObjectURL(blob);
                        link.setAttribute('href', url);
                        link.setAttribute('download', `forms_export_${new Date().toISOString().split('T')[0]}.csv`);
                        link.style.visibility = 'hidden';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        showNotification('Forms data exported successfully!', 'success');
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                    >
                      <Download size={16} />
                      Export Forms
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
