import React, { useState } from 'react';
import { X, Plus, Trash2, Send, Check } from 'lucide-react';
import { apiCall } from '../utils/api';

const BulkSendNDAModal = ({ onClose, vendors, onSuccess }) => {
  const [selectedVendors, setSelectedVendors] = useState([]);
  const [newVendors, setNewVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectAll, setSelectAll] = useState(false);

  const handleSelectVendor = (vendorId) => {
    setSelectedVendors(prev => 
      prev.includes(vendorId) 
        ? prev.filter(id => id !== vendorId)
        : [...prev, vendorId]
    );
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedVendors([]);
    } else {
      setSelectedVendors(vendors.filter(v => v.id !== 'metadata').map(v => v.id));
    }
    setSelectAll(!selectAll);
  };

  const addNewVendor = () => {
    setNewVendors(prev => [...prev, { company_name: '', contact_person: '', email: '' }]);
  };

  const updateNewVendor = (index, field, value) => {
    setNewVendors(prev => prev.map((vendor, i) => 
      i === index ? { ...vendor, [field]: value } : vendor
    ));
  };

  const removeNewVendor = (index) => {
    setNewVendors(prev => prev.filter((_, i) => i !== index));
  };

  const handleBulkSend = async () => {
    if (selectedVendors.length === 0 && newVendors.length === 0) {
      alert('Please select vendors or add new vendors to send NDAs');
      return;
    }

    // Validate new vendors
    const validNewVendors = newVendors.filter(vendor => 
      vendor.company_name && vendor.contact_person && vendor.email
    );

    if (newVendors.length > 0 && validNewVendors.length !== newVendors.length) {
      alert('Please fill all fields for new vendors');
      return;
    }

    setLoading(true);
    try {
      const response = await apiCall('/api/admin/send-bulk-nda', {
        method: 'POST',
        body: JSON.stringify({
          selected_vendors: selectedVendors,
          new_vendors: validNewVendors
        })
      });

      if (response.success) {
        onSuccess(response.message);
        onClose();
      } else {
        alert('Failed to send bulk NDAs');
      }
    } catch (error) {
      console.error('Bulk send error:', error);
      alert('Failed to send bulk NDAs');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
          <h2 className="text-2xl font-bold text-gray-900">Bulk Send NDA</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 modal-scrollbar">
          {/* Existing Vendors Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Select Existing Vendors</h3>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="selectAll"
                  checked={selectAll}
                  onChange={handleSelectAll}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="selectAll" className="text-sm font-medium text-gray-700">
                  Select All ({vendors.filter(v => v.id !== 'metadata').length})
                </label>
              </div>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-4 modal-scrollbar">
              {vendors.filter(v => v.id !== 'metadata').map(vendor => (
                <div key={vendor.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg">
                  <input
                    type="checkbox"
                    id={`vendor-${vendor.id}`}
                    checked={selectedVendors.includes(vendor.id)}
                    onChange={() => handleSelectVendor(vendor.id)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{vendor.company_name}</div>
                    <div className="text-sm text-gray-500">
                      {vendor.contact_person} • {vendor.email}
                    </div>
                    <div className="text-xs text-gray-400">
                      Status: {vendor.nda_status} • Reference: {vendor.reference_number}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* New Vendors Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add New Vendors</h3>
              <button
                onClick={addNewVendor}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                <Plus size={16} />
                Add Vendor
              </button>
            </div>

            <div className="space-y-4">
              {newVendors.map((vendor, index) => (
                <div key={index} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">New Vendor {index + 1}</h4>
                    <button
                      onClick={() => removeNewVendor(index)}
                      className="p-1 text-red-500 hover:bg-red-100 rounded"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Company Name *
                      </label>
                      <input
                        type="text"
                        value={vendor.company_name}
                        onChange={(e) => updateNewVendor(index, 'company_name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter company name"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contact Person *
                      </label>
                      <input
                        type="text"
                        value={vendor.contact_person}
                        onChange={(e) => updateNewVendor(index, 'contact_person', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter contact person"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        value={vendor.email}
                        onChange={(e) => updateNewVendor(index, 'email', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter email address"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleBulkSend}
            disabled={loading || (selectedVendors.length === 0 && newVendors.length === 0)}
            className="flex items-center gap-2 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send size={16} />
            )}
            Send NDAs ({selectedVendors.length + newVendors.length})
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkSendNDAModal;
