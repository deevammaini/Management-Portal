import React, { useState, useEffect } from 'react';
import { Download, FileText, Target, Users, TrendingUp, CheckCircle, Clock, AlertCircle, BarChart3 } from 'lucide-react';
import { apiCall } from '../utils/api';

const ReportsView = ({ showNotification }) => {
  const [leadReports, setLeadReports] = useState([]);
  const [vendorReports, setVendorReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReportData();
  }, []);

  const loadReportData = async () => {
    try {
      setLoading(true);
      // Fetch lead generation reports
      const leadsData = await apiCall('/api/admin/leads');
      
      // Fetch vendor reports
      const vendorsData = await apiCall('/api/admin/vendors');
      
      setLeadReports(leadsData || []);
      
      const metadata = vendorsData.find(v => v.id === 'metadata');
      setVendorReports({
        total: vendorsData.filter(v => v.id !== 'metadata').length,
        ndaCompleted: metadata?.nda_completed_count || 0,
        ndaSent: metadata?.nda_sent_count || 0,
        portalAccess: metadata?.portal_access_count || 0,
        pending: metadata?.pending_count || 0,
        vendors: vendorsData.filter(v => v.id !== 'metadata')
      });
      
    } catch (error) {
      console.error('Failed to load report data:', error);
      showNotification('Failed to load report data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const exportLeadReport = () => {
    const csvData = [['Lead ID', 'Company', 'Email', 'Status', 'Priority', 'Assigned To', 'Created Date']];
    leadReports.forEach(lead => {
      csvData.push([
        lead.id || '',
        lead.company_name || '',
        lead.client_email || '',
        lead.assignment_status || lead.lead_status || '',
        lead.lead_source || '',
        lead.assigned_employee_name || 'Unassigned',
        lead.created_at || ''
      ]);
    });
    
    const csvString = csvData.map(row => 
      row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    
    downloadCSV(csvString, `lead_generation_report_${new Date().toISOString().split('T')[0]}.csv`);
    showNotification('Lead generation report exported successfully!', 'success');
  };

  const exportVendorReport = () => {
    const csvData = [['Vendor ID', 'Company Name', 'Email', 'Contact Person', 'Status', 'NDA Status', 'Portal Access', 'Reference Number', 'Created Date']];
    vendorReports.vendors.forEach(vendor => {
      // Determine status based on registration_status or nda_status
      let status = '';
      if (vendor.registration_status) {
        status = vendor.registration_status;
      } else if (vendor.nda_status) {
        status = vendor.nda_status;
      }
      
      csvData.push([
        vendor.id || '',
        vendor.company_name || '',
        vendor.email || '',
        vendor.contact_person || '',
        status || 'N/A',
        vendor.nda_status || 'N/A',
        vendor.portal_access ? 'Yes' : 'No',
        vendor.reference_number || '',
        vendor.created_at || ''
      ]);
    });
    
    const csvString = csvData.map(row => 
      row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    
    downloadCSV(csvString, `vendor_report_${new Date().toISOString().split('T')[0]}.csv`);
    showNotification('Vendor report exported successfully!', 'success');
  };

  const downloadCSV = (csvString, filename) => {
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reports</h2>
          <p className="text-gray-600">Comprehensive reports and analytics</p>
        </div>
      </div>

      {/* Report Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Lead Generation Reports */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6">
            <div className="flex items-center gap-3">
              <Target className="text-white" size={28} />
              <div>
                <h3 className="text-xl font-bold text-white">Lead Generation Reports</h3>
                <p className="text-blue-100 text-sm">Track and analyze your lead pipeline</p>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="text-blue-600" size={20} />
                  <span className="font-semibold text-gray-700">Total Leads</span>
                </div>
                <span className="text-2xl font-bold text-blue-600">{leadReports.length}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="text-green-600" size={16} />
                    <span className="text-sm text-gray-600">Active Leads</span>
                  </div>
                  <p className="text-xl font-bold text-gray-900">
                    {leadReports.filter(l => l.status === 'active' || l.status === 'open').length}
                  </p>
                </div>
                
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="text-yellow-600" size={16} />
                    <span className="text-sm text-gray-600">Pending</span>
                  </div>
                  <p className="text-xl font-bold text-gray-900">
                    {leadReports.filter(l => l.status === 'pending').length}
                  </p>
                </div>
              </div>
              
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="text-purple-600" size={16} />
                  <span className="text-sm text-gray-600">High Priority Leads</span>
                </div>
                <p className="text-xl font-bold text-gray-900">
                  {leadReports.filter(l => l.priority === 'high').length}
                </p>
              </div>
            </div>
            
            <button
              onClick={exportLeadReport}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              <Download size={18} />
              Export Lead Report
            </button>
          </div>
        </div>

        {/* Vendor Reports */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-green-600 p-6">
            <div className="flex items-center gap-3">
              <Users className="text-white" size={28} />
              <div>
                <h3 className="text-xl font-bold text-white">Vendor Reports</h3>
                <p className="text-green-100 text-sm">Manage vendor relationships</p>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Users className="text-green-600" size={20} />
                  <span className="font-semibold text-gray-700">Total Vendors</span>
                </div>
                <span className="text-2xl font-bold text-green-600">{vendorReports.total}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="text-green-600" size={16} />
                    <span className="text-sm text-gray-600">NDA Completed</span>
                  </div>
                  <p className="text-xl font-bold text-gray-900">{vendorReports.ndaCompleted}</p>
                </div>
                
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertCircle className="text-orange-600" size={16} />
                    <span className="text-sm text-gray-600">Pending</span>
                  </div>
                  <p className="text-xl font-bold text-gray-900">{vendorReports.pending}</p>
                </div>
              </div>
              
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="text-purple-600" size={16} />
                  <span className="text-sm text-gray-600">Portal Access Granted</span>
                </div>
                <p className="text-xl font-bold text-gray-900">{vendorReports.portalAccess}</p>
              </div>
            </div>
            
            <button
              onClick={exportVendorReport}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
            >
              <Download size={18} />
              Export Vendor Report
            </button>
          </div>
        </div>
      </div>

      {/* Additional Reports Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <BarChart3 className="text-purple-600" size={24} />
          Additional Reports
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
            <h4 className="font-semibold text-gray-900 mb-2">Sales Performance</h4>
            <p className="text-sm text-gray-600 mb-3">View sales metrics and performance indicators</p>
            <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
              View Report →
            </button>
          </div>
          
          <div className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
            <h4 className="font-semibold text-gray-900 mb-2">Customer Engagement</h4>
            <p className="text-sm text-gray-600 mb-3">Track customer interactions and engagement levels</p>
            <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
              View Report →
            </button>
          </div>
          
          <div className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
            <h4 className="font-semibold text-gray-900 mb-2">Financial Summary</h4>
            <p className="text-sm text-gray-600 mb-3">Overview of financial transactions and reports</p>
            <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
              View Report →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsView;

