import React, { useState } from 'react';
import { Search, Send, CheckCircle, Plus, Download, Users } from 'lucide-react';
import { apiCall } from '../utils/api';
import BulkSendNDAModal from './BulkSendNDAModal';

const VendorsView = ({ vendors, onSendNDA, onReload, showNotification }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showBulkModal, setShowBulkModal] = useState(false);

  const filteredVendors = vendors.filter(vendor => {
    if (vendor.id === 'metadata') return false;
    const matchesSearch = vendor.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || vendor.nda_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleApprove = async (vendorId) => {
    try {
      console.log(`Attempting to approve vendor ID: ${vendorId}`);
      const response = await apiCall(`/api/admin/vendors/${vendorId}/approve-portal-access`, { method: 'POST' });
      console.log('Approval response:', response);
      
      if (response.success) {
        showNotification('Portal access approved!', 'success');
        onReload();
      } else {
        showNotification(`Failed to approve: ${response.message || response.error}`, 'error');
      }
    } catch (error) {
      console.error('Approval error:', error);
      showNotification(`Failed to approve: ${error.message || 'Unknown error'}`, 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Vendor Management</h2>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowBulkModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            <Users size={18} />
            Bulk Send NDA
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
            <Download size={18} />
            Export
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600">
            <Plus size={18} />
            Add Vendor
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-6 border-b">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search vendors..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="sent">Sent</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Company</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Reference</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredVendors.map(vendor => (
                <tr key={vendor.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-semibold">{vendor.company_name?.[0] || '?'}</span>
                      </div>
                      <div className="font-medium">{vendor.company_name || 'N/A'}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{vendor.email}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-mono rounded">
                      {vendor.reference_number || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      vendor.nda_status === 'completed' ? 'bg-green-100 text-green-700' :
                      vendor.nda_status === 'sent' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {vendor.nda_status?.toUpperCase() || 'PENDING'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => onSendNDA(vendor)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Send NDA"
                      >
                        <Send size={16} />
                      </button>
                      <button
                        onClick={() => handleApprove(vendor.id)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                        title="Approve"
                      >
                        <CheckCircle size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showBulkModal && (
        <BulkSendNDAModal
          onClose={() => setShowBulkModal(false)}
          vendors={vendors}
          onSuccess={(message) => {
            showNotification(message, 'success');
            onReload();
          }}
        />
      )}
    </div>
  );
};

export default VendorsView;
