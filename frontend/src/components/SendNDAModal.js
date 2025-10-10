import React, { useState } from 'react';
import { X } from 'lucide-react';

const SendNDAModal = ({ onClose, onSend }) => {
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');

  const handleSubmit = () => {
    if (email && companyName) {
      onSend({ email, company_name: companyName });
      setEmail('');
      setCompanyName('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">Send NDA to New Vendor</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
          </div>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Company Name</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="Enter company name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="vendor@company.com"
            />
          </div>
        </div>
        
        <div className="p-6 bg-gray-50 rounded-b-xl flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border rounded-lg hover:bg-white transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg hover:from-amber-600 hover:to-amber-700 font-medium"
          >
            Send NDA
          </button>
        </div>
      </div>
    </div>
  );
};

export default SendNDAModal;
